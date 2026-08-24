import { randomBytes } from 'node:crypto';

import bcrypt from 'bcryptjs';

import { User } from '@/models/user.model';
import { UserDto, userFromEntity } from '@/types';

import { EMAIL_VERIFICATION } from '@/constants/account.const';
import { CODES } from '@/constants/codes.const';
import { RATE_LIMIT } from '@/constants/rate-limit.const';
import { USER_ROLES } from '@/constants/roles.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import { SingleResult, createError, singleFailure, singleSuccess } from '@/lib/result';
import type { StudentRegistrationOutput, TeacherRegistrationOutput } from '@/lib/schemas';
import { looksLikeLoginId } from '@/lib/utils';
import type { IssuableRole } from '@/lib/utils';

import { issueLoginId } from './login-id.issuer';
import { consumeRateLimit, resetRateLimit } from './rate-limit.guard';
import { hashToken } from './token.hash';

import type { UserEntity } from '@/models/user.model';

const log = createLoggerWithContext('auth.service');

const AUTH = CODES.AUTH.USERS;
const BUSINESS_COMMON = CODES.BUSINESS.COMMON;
const VALIDATION = CODES.VALIDATION.USERS;
const BUSINESS = CODES.BUSINESS.USERS;
const DATABASE = CODES.DATABASE.USERS;

/*
  Matches `PASSWORD_SALT_ROUNDS` in `user.model.ts` so the dummy comparison below costs the
  same as a real one. Kept local rather than imported to keep this service off the model's
  hashing internals; the two are pinned together by the sign-in timing test.
*/
const SIGN_IN_HASH_ROUNDS = 12;

let dummyPasswordHash: string | null = null;

/**
 * A throwaway bcrypt hash, built once and reused.
 *
 * Compared against on the account-not-found branch so a wrong identifier costs the same
 * ~250ms as a wrong password — without it, a missing account returns in a few milliseconds
 * and an existing one in a quarter second, a timing oracle that discloses which enumerable
 * login IDs are live. Built lazily, so a process that never sees a failed sign-in never
 * pays to build it; the input is arbitrary and matches no real password.
 *
 * @returns A stable bcrypt hash whose comparison takes a real password's time.
 */
function dummyHashForTiming(): string {
  if (!dummyPasswordHash) {
    dummyPasswordHash = bcrypt.hashSync('sign-in-timing-equalizer', SIGN_IN_HASH_ROUNDS);
  }

  return dummyPasswordHash;
}

/**
 * A freshly registered account, plus the one-time token the caller has to mail out.
 *
 * The raw token leaves the service exactly once and is never stored — only its hash is.
 * Returning it rather than sending it from here keeps the service free of the mail
 * layer, and lets the action decide what a failed send means.
 */
export type Registration = {
  user: UserDto;
  verificationToken: string;
};

/**
 * A verified account and the identifier it was just issued.
 *
 * `loginId` is on the DTO as well; it is named separately because the caller has to put
 * it in an email and on a screen, and reaching into an optional field for something this
 * important reads like an afterthought.
 */
export type Verification = {
  user: UserDto;
  loginId: string;
};

/**
 * A reissued confirmation, and the token the caller has to mail.
 *
 * Returned inside a `SingleResult` whose failure is the one case the resend screen names —
 * an address with no account. A success carrying `null` is the other side of that: the
 * account exists, so it is not the not-registered error, but there was nothing to send
 * (already confirmed, deactivated, or still inside the cooldown), and the screen says
 * "check your inbox" without an email going out.
 */
export type Reissue = {
  user: UserDto;
  verificationToken: string;
};

/**
 * A password-reset request, and the raw token to mail.
 *
 * The token leaves the service once and is never stored — only its hash is — the same
 * discipline `Registration` keeps. Returned rather than mailed from here so the service
 * stays free of the mail layer.
 */
export type PasswordReset = {
  user: UserDto;
  resetToken: string;
};

export class AuthService {
  /**
   * Check an identifier and password, and report why they were refused.
   *
   * The order matters, and it is the same order as before step 12: the password is
   * verified first, so account state — unverified, waiting for approval, deactivated —
   * is only ever disclosed to somebody who already proved they own the account.
   *
   * @param identifier - Login ID or email address, as typed.
   * @param password - Password as typed.
   *
   * @returns The user on success, or a failure carrying the reason.
   */
  public async verifyCredentials(identifier: string, password: string): Promise<SingleResult<UserDto>> {
    try {
      await connectToDatabase();

      /*
        Counted before the password is checked, and keyed on the identifier exactly as it
        was typed. Two things follow, and both are deliberate.

        An identifier nobody owns throttles the same as one that exists, so the refusal
        cannot be used to discover which accounts are real — the same rule the shared
        `invalidCredentials()` message already follows, and it would be undone by a
        limiter that only counted attempts against accounts that exist.

        And bcrypt at cost 12 is roughly a quarter-second of pegged CPU per attempt on a
        single forked process. Refusing before that runs is what keeps a spray from
        stopping the department's app rather than merely failing.
      */
      if (!(await consumeRateLimit('sign-in', identifier, RATE_LIMIT.SIGN_IN))) {
        return singleFailure(createError(BUSINESS_COMMON.TOO_MANY_REQUESTS.CODE, BUSINESS_COMMON.TOO_MANY_REQUESTS.MESSAGE));
      }

      const matchedByLoginId = looksLikeLoginId(identifier);
      const user = await this.resolveByIdentifier(identifier);

      if (!user) {
        /*
          Spend the same bcrypt time as a real comparison, so a missing account and a wrong
          password are indistinguishable by response time and not only by message — the
          shared `invalidCredentials()` text is undone by a millisecond-fast not-found path.
        */
        await bcrypt.compare(password, dummyHashForTiming());

        return this.invalidCredentials();
      }

      const matches = await user.comparePassword(password);

      if (!matches) {
        return this.invalidCredentials();
      }

      /*
        An account that has been issued an identifier signs in with it, and only with it.
        Letting the email address work too would make the identifier decorative — nobody
        would ever learn theirs — and would contradict the message that delivered it,
        which says in as many words to use this and not your email.

        Refused *after* the password check, so the answer is only ever given to somebody
        who already proved the account is theirs. Before that point it is
        indistinguishable from a wrong password, which is what stops it being a way to
        discover which addresses are registered.
      */
      if (!matchedByLoginId && user.loginId) {
        return singleFailure(createError(AUTH.SIGN_IN_WITH_LOGIN_ID.CODE, AUTH.SIGN_IN_WITH_LOGIN_ID.MESSAGE));
      }

      if (!user.isActive) {
        return singleFailure(createError(AUTH.ACCOUNT_DEACTIVATED.CODE, AUTH.ACCOUNT_DEACTIVATED.MESSAGE));
      }

      /*
        Two gates, and they are told apart on purpose. "Confirm your address" and "wait
        for the department" are different problems with different remedies, and one
        message for both leaves the visitor with nothing to act on. Verification is
        checked first because it is the one they can fix themselves.
      */
      if (!user.emailVerified) {
        return singleFailure(createError(AUTH.EMAIL_NOT_VERIFIED.CODE, AUTH.EMAIL_NOT_VERIFIED.MESSAGE));
      }

      if (!user.isApproved) {
        return singleFailure(createError(AUTH.ACCOUNT_NOT_APPROVED.CODE, AUTH.ACCOUNT_NOT_APPROVED.MESSAGE));
      }

      /*
        Cleared on the way through, so the allowance counts consecutive failures rather
        than lifetime ones. Somebody who mistypes twice and then gets it right starts
        their next visit with a full five, which is the difference between a speed bump
        and a punishment.

        After the state gates rather than before them: an account that is unverified,
        unapproved or switched off has proved the password but still cannot sign in, and
        an unlimited retry against those would be an unlimited password oracle.
      */
      await resetRateLimit('sign-in', identifier);

      return singleSuccess(userFromEntity(user));
    } catch (error) {
      log.error({ err: error }, 'Credential verification failed');

      return singleFailure(createError(AUTH.SIGN_IN_FAILED.CODE, AUTH.SIGN_IN_FAILED.MESSAGE));
    }
  }

  /**
   * Register a student. The account is unverified, unapproved, and holds no identifier.
   *
   * @param input - Validated student registration.
   *
   * @returns The account and the token to mail, or a failure.
   */
  public async registerStudent(input: StudentRegistrationOutput): Promise<SingleResult<Registration>> {
    return this.register(USER_ROLES.STUDENT, input.email, {
      name: input.name,
      email: input.email,
      password: input.password,
      role: USER_ROLES.STUDENT,
      roll: input.roll,
      registrationNo: input.registrationNo,
      session: input.session,
      department: input.department,
      semester: input.semester,
    });
  }

  /**
   * Register a teacher. Collects less than a student, and is otherwise identical.
   *
   * @param input - Validated teacher registration.
   *
   * @returns The account and the token to mail, or a failure.
   */
  public async registerTeacher(input: TeacherRegistrationOutput): Promise<SingleResult<Registration>> {
    return this.register(USER_ROLES.TEACHER, input.email, {
      name: input.name,
      email: input.email,
      password: input.password,
      role: USER_ROLES.TEACHER,
      department: input.department,
    });
  }

  /**
   * Confirm an address, and issue the identifier that confirmation earns.
   *
   * Both halves happen here rather than at registration, and the ordering is the whole
   * design: an application nobody confirms never consumes an identifier, and the
   * identifier can only be delivered to an address that has just been proven.
   *
   * The token is single-use — cleared on success — so a link that leaks after the fact
   * opens nothing.
   *
   * @param token - Raw token from the link.
   *
   * @returns The account and its new identifier, or a failure.
   */
  public async verifyEmail(token: string): Promise<SingleResult<Verification>> {
    try {
      await connectToDatabase();

      const user = await User.findOne({ emailVerificationTokenHash: hashToken(token) }).select('+emailVerificationTokenHash');

      if (!user) {
        return singleFailure(createError(VALIDATION.VERIFICATION_LINK_INVALID.CODE, VALIDATION.VERIFICATION_LINK_INVALID.MESSAGE));
      }

      if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt.getTime() < Date.now()) {
        return singleFailure(createError(VALIDATION.VERIFICATION_LINK_EXPIRED.CODE, VALIDATION.VERIFICATION_LINK_EXPIRED.MESSAGE));
      }

      /*
        Following the link twice is not an error worth showing. The token is cleared on
        first use, so a second click finds nothing and would otherwise read as "invalid"
        — which is alarming for somebody who simply refreshed the page. An account that
        already holds an identifier is reported as the success it is.
      */
      if (user.emailVerified && user.loginId) {
        return singleSuccess({ user: userFromEntity(user), loginId: user.loginId });
      }

      const loginId = await issueLoginId(user.role as IssuableRole);

      if (!loginId) {
        return singleFailure(createError(BUSINESS.LOGIN_ID_NOT_ISSUED.CODE, BUSINESS.LOGIN_ID_NOT_ISSUED.MESSAGE));
      }

      user.set({
        loginId,
        emailVerified: true,
        emailVerificationTokenHash: undefined,
        emailVerificationExpiresAt: undefined,
      });

      await user.save();

      return singleSuccess({ user: userFromEntity(user), loginId });
    } catch (error) {
      log.error({ err: error }, 'Email verification failed');

      return singleFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * Move an account onto the address it asked for, now that the address has answered.
   *
   * Lives here beside `verifyEmail` rather than in `UserService` with the method that
   * started the change, because this is the same act: somebody arriving from an inbox
   * with a token, holding no session. The link is as likely to be opened on a phone as in
   * the browser that submitted the form, so it cannot require one.
   *
   * The address is re-checked against every other account at this moment and not only
   * when it was requested. Two people may both ask for one address — nothing stops them,
   * and nothing should, since a claim nobody confirms would otherwise reserve an address
   * forever — so the second person to click is refused here rather than colliding with
   * the unique index and surfacing as an unexplained failure.
   *
   * `emailVerified` is not touched. It was already true for anybody who could sign in and
   * reach the profile, and this proves the new address rather than re-proving the account.
   *
   * @param token - Raw token from the link.
   *
   * @returns The account on its new address, or a failure.
   */
  public async confirmEmailChange(token: string): Promise<SingleResult<UserDto>> {
    try {
      await connectToDatabase();

      const user = await User.findOne({ pendingEmailTokenHash: hashToken(token) }).select('+pendingEmailTokenHash');

      if (!user || !user.pendingEmail) {
        return singleFailure(createError(VALIDATION.VERIFICATION_LINK_INVALID.CODE, VALIDATION.VERIFICATION_LINK_INVALID.MESSAGE));
      }

      if (!user.pendingEmailExpiresAt || user.pendingEmailExpiresAt.getTime() < Date.now()) {
        return singleFailure(createError(VALIDATION.VERIFICATION_LINK_EXPIRED.CODE, VALIDATION.VERIFICATION_LINK_EXPIRED.MESSAGE));
      }

      const taken = await User.findOne({ email: user.pendingEmail, _id: { $ne: user._id } }).lean<UserEntity | null>();

      if (taken) {
        return singleFailure(createError(VALIDATION.EMAIL_ALREADY_USED.CODE, VALIDATION.EMAIL_ALREADY_USED.MESSAGE, 'email'));
      }

      /*
        Single-use, like the registration token: cleared as the address is written, so
        following the link again finds nothing. A second click therefore reports an
        invalid link rather than silently re-applying a change — which is the right answer
        here, unlike at registration, because by then the address has already moved and
        may have moved again since.
      */
      user.set({
        email: user.pendingEmail,
        pendingEmail: undefined,
        pendingEmailTokenHash: undefined,
        pendingEmailExpiresAt: undefined,
      });

      await user.save();

      return singleSuccess(userFromEntity(user));
    } catch (error) {
      log.error({ err: error }, 'Confirming an email change failed');

      return singleFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * Find the account behind whatever was typed into the one sign-in field.
   *
   * The shape decides the lookup: anything matching the issued-identifier pattern is
   * looked up as one, anything else as an email address. No fallback between them —
   * they cannot collide, so a miss is a miss rather than a reason to try the other
   * index and double the work on every failed sign-in.
   *
   * @param identifier - Login ID or email address, as typed.
   *
   * @returns The account with its password selected, or null.
   */
  private async resolveByIdentifier(identifier: string) {
    const trimmed = identifier.trim();

    if (looksLikeLoginId(trimmed)) {
      return User.findOne({ loginId: trimmed.toUpperCase() }).select('+password');
    }

    return User.findOne({ email: trimmed.toLowerCase() }).select('+password');
  }

  /**
   * The shared half of both registrations.
   *
   * @param role - Which kind of account is being made.
   * @param email - The address, for the duplicate check.
   * @param attributes - Everything to write.
   *
   * @returns The account and the token to mail, or a failure.
   */
  private async register(role: IssuableRole, email: string, attributes: Record<string, unknown>): Promise<SingleResult<Registration>> {
    try {
      await connectToDatabase();

      const existing = await User.findOne({ email }).lean<UserEntity | null>();

      if (existing) {
        return singleFailure(createError(VALIDATION.EMAIL_ALREADY_USED.CODE, VALIDATION.EMAIL_ALREADY_USED.MESSAGE, 'email'));
      }

      if (role === USER_ROLES.STUDENT && typeof attributes.roll === 'string') {
        const takenRoll = await User.findOne({ role: USER_ROLES.STUDENT, roll: attributes.roll }).lean<UserEntity | null>();

        if (takenRoll) {
          return singleFailure(createError(VALIDATION.ROLL_ALREADY_USED.CODE, VALIDATION.ROLL_ALREADY_USED.MESSAGE, 'roll'));
        }
      }

      const token = randomBytes(EMAIL_VERIFICATION.TOKEN_BYTES).toString('hex');

      const created = await User.create({
        ...attributes,
        /*
          Both false, and neither is settable from the form — there is no field for them
          in the schema, so an applicant cannot approve themselves whatever they post.
        */
        emailVerified: false,
        isApproved: false,
        isActive: true,
        emailVerificationTokenHash: hashToken(token),
        emailVerificationExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION.LIFETIME_HOURS * 60 * 60 * 1000),
      });

      return singleSuccess({ user: userFromEntity(created), verificationToken: token });
    } catch (error) {
      log.error({ err: error }, 'Registration failed');

      return singleFailure(createError(DATABASE.CREATE_FAILED.CODE, DATABASE.CREATE_FAILED.MESSAGE));
    }
  }

  /**
   * Issue a fresh confirmation token for an address that has not been confirmed.
   *
   * The remedy for the link that never arrived. Without it a spam-filtered email means
   * an account nobody can ever reach: the token is single-use, the identifier is only
   * delivered once, and there is no other way in.
   *
   * The department asked for an explicit answer over a silent one, so an address with no
   * account is a failure carrying `EMAIL_NOT_REGISTERED` rather than a quiet nothing —
   * which is a deliberate reversal of the anti-enumeration stance the rest of the auth
   * surface keeps, and turns this screen into a way to probe which addresses exist. Every
   * other non-sending case — already confirmed, deactivated, or still inside the cooldown —
   * is a success carrying `null`: the account exists, there is simply nothing to send, and
   * the screen says "check your inbox" without leaking which of those it was.
   *
   * The previous token stops working, because a new one replaces the stored hash. Asking
   * for a second link invalidates the first, which is what makes a leaked old email
   * harmless.
   *
   * @param email - Address as typed.
   *
   * @returns The account and its new token; a null payload when the account exists but
   *   nothing was sent; a failure when no account is registered.
   */
  public async reissueVerification(email: string): Promise<SingleResult<Reissue | null>> {
    try {
      await connectToDatabase();

      const user = await User.findOne({ email: email.trim().toLowerCase() });

      // The one case the screen names out loud.
      if (!user) {
        return singleFailure(createError(VALIDATION.EMAIL_NOT_REGISTERED.CODE, VALIDATION.EMAIL_NOT_REGISTERED.MESSAGE, 'email'));
      }

      // Registered, but there is nothing to send. Success with a null payload, so the
      // account's state (confirmed, switched off) is not disclosed the way not-found now is.
      if (user.emailVerified || !user.isActive) {
        return singleSuccess(null);
      }

      /*
        The throttle, and it needs no shared store: the live token already records when
        it was minted — expiry minus its lifetime — so "you asked a moment ago" is a
        question the row can answer. An in-memory counter would reset on deploy and count
        separately per instance; this behaves the same however many are running.

        A throttled repeat is a null success, not a failure — the last link is still in the
        inbox and still works, so there is nothing to report and nothing new to send.
      */
      const issuedAt = user.emailVerificationExpiresAt
        ? user.emailVerificationExpiresAt.getTime() - EMAIL_VERIFICATION.LIFETIME_HOURS * 60 * 60 * 1000
        : null;

      if (issuedAt !== null && Date.now() - issuedAt < EMAIL_VERIFICATION.RESEND_COOLDOWN_MINUTES * 60 * 1000) {
        return singleSuccess(null);
      }

      const token = randomBytes(EMAIL_VERIFICATION.TOKEN_BYTES).toString('hex');

      user.set({
        emailVerificationTokenHash: hashToken(token),
        emailVerificationExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION.LIFETIME_HOURS * 60 * 60 * 1000),
      });

      await user.save();

      return singleSuccess({ user: userFromEntity(user), verificationToken: token });
    } catch (error) {
      log.error({ err: error }, 'Reissuing a verification token failed');

      return singleFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * Mint a password-reset token for an account that can actually use one.
   *
   * The request half of forgot-password, and the closest sibling of `reissueVerification`.
   * It acts only on a verified, active account — the address is the recovery channel, so an
   * unverified one has no login to recover and its remedy is resend-confirmation instead;
   * approval is not required, since a verified account waiting for approval may still set
   * its password ahead of time.
   *
   * The department chose the same explicit answer here as on resend, so an unregistered
   * address is a failure carrying `EMAIL_NOT_REGISTERED` — accepting the same enumeration
   * trade in exchange for a screen that says "no account here" rather than a silent one. A
   * registered-but-unusable account (unverified, deactivated, or inside the cooldown) is a
   * null success: nothing is sent, and which of those it was is not disclosed.
   *
   * Minting a fresh token overwrites the stored hash, so an earlier reset link stops
   * working — asking twice cannot leave two live links.
   *
   * @param email - Address as typed.
   *
   * @returns The account and its raw reset token; a null payload when there is nothing to
   *   send; a failure when no account is registered.
   */
  public async issuePasswordReset(email: string): Promise<SingleResult<PasswordReset | null>> {
    try {
      await connectToDatabase();

      const user = await User.findOne({ email: email.trim().toLowerCase() });

      if (!user) {
        return singleFailure(createError(VALIDATION.EMAIL_NOT_REGISTERED.CODE, VALIDATION.EMAIL_NOT_REGISTERED.MESSAGE, 'email'));
      }

      // Registered but with no recoverable login, or switched off — nothing to send, and
      // the state is not disclosed.
      if (!user.emailVerified || !user.isActive) {
        return singleSuccess(null);
      }

      // The same row-derived cooldown as reissueVerification, on this token's own timestamp.
      const issuedAt = user.passwordResetExpiresAt
        ? user.passwordResetExpiresAt.getTime() - EMAIL_VERIFICATION.LIFETIME_HOURS * 60 * 60 * 1000
        : null;

      if (issuedAt !== null && Date.now() - issuedAt < EMAIL_VERIFICATION.RESEND_COOLDOWN_MINUTES * 60 * 1000) {
        return singleSuccess(null);
      }

      const token = randomBytes(EMAIL_VERIFICATION.TOKEN_BYTES).toString('hex');

      user.set({
        passwordResetTokenHash: hashToken(token),
        passwordResetExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION.LIFETIME_HOURS * 60 * 60 * 1000),
      });

      await user.save();

      return singleSuccess({ user: userFromEntity(user), resetToken: token });
    } catch (error) {
      log.error({ err: error }, 'Issuing a password reset failed');

      return singleFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * Set a new password from a reset link.
   *
   * The apply half, cloning `verifyEmail`'s single-use consume: look the token up by its
   * hash, refuse a missing one as invalid and a stale one as expired, then write the new
   * password and clear the token so a second click opens nothing. Hashing is the model's
   * pre-save hook — assigning the plaintext and saving is enough; this method never touches
   * bcrypt itself.
   *
   * @param token - Raw token from the link.
   * @param newPassword - The new password, already validated for length.
   *
   * @returns The account, or a failure naming the link's problem.
   */
  public async resetPassword(token: string, newPassword: string): Promise<SingleResult<UserDto>> {
    try {
      await connectToDatabase();

      const user = await User.findOne({ passwordResetTokenHash: hashToken(token) }).select('+passwordResetTokenHash');

      if (!user) {
        return singleFailure(createError(VALIDATION.VERIFICATION_LINK_INVALID.CODE, VALIDATION.VERIFICATION_LINK_INVALID.MESSAGE));
      }

      if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
        return singleFailure(createError(VALIDATION.VERIFICATION_LINK_EXPIRED.CODE, VALIDATION.VERIFICATION_LINK_EXPIRED.MESSAGE));
      }

      user.set({
        password: newPassword,
        passwordResetTokenHash: undefined,
        passwordResetExpiresAt: undefined,
      });

      await user.save();

      return singleSuccess(userFromEntity(user));
    } catch (error) {
      log.error({ err: error }, 'Resetting a password failed');

      return singleFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * One shared failure for an unknown identifier and a wrong password. Distinguishing
   * them would let anyone probe which accounts exist here.
   */
  private invalidCredentials(): SingleResult<UserDto> {
    return singleFailure(createError(AUTH.INVALID_CREDENTIALS.CODE, AUTH.INVALID_CREDENTIALS.MESSAGE));
  }
}
