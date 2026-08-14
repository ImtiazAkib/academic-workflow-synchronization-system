import { randomBytes } from 'node:crypto';

import { ClassSession } from '@/models/class-session.model';
import { Course } from '@/models/course.model';
import { Material } from '@/models/material.model';
import { Notice } from '@/models/notice.model';
import { User } from '@/models/user.model';
import { SessionUser, UserDto, UserFilters, UserRole, userFromEntity } from '@/types';

import { EMAIL_VERIFICATION } from '@/constants/account.const';
import { CODES } from '@/constants/codes.const';
import { ADMIN_LIMIT, USER_ROLES } from '@/constants/roles.const';
import { FILTER_ALL, USER_STATUS_FILTERS } from '@/constants/users.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import {
  EmptyResult,
  ListResult,
  SingleResult,
  createError,
  emptyFailureWithError,
  emptySuccess,
  listFailure,
  listSuccess,
  singleFailure,
  singleSuccess,
} from '@/lib/result';
import type {
  ChangePasswordOutput,
  ProfileUpdateOutput,
  UserActivateOutput,
  UserApproveOutput,
  UserCreateOutput,
  UserUpdateOutput,
} from '@/lib/schemas';
import { storage } from '@/lib/storage';
import { escapeRegExp, isIssuableRole, toId } from '@/lib/utils';

import { issueLoginId } from './login-id.issuer';
import { hashToken } from './token.hash';

import type { UserAttributes, UserEntity } from '@/models/user.model';
// Mongoose 9 renamed `FilterQuery` to `QueryFilter`. `UpdateQuery` kept its name.
import type { QueryFilter, UpdateQuery } from 'mongoose';

const log = createLoggerWithContext('user.service');

const DATABASE = CODES.DATABASE.USERS;
const VALIDATION = CODES.VALIDATION.USERS;
const BUSINESS = CODES.BUSINESS.USERS;
const AUTH = CODES.AUTH.USERS;

/**
 * A saved profile, plus the one-time token an address change has to be proven with.
 *
 * `pendingEmailToken` is null whenever the address did not move, which is most of the
 * time. It leaves the service exactly once and is never stored — only its hash is —
 * and returning it rather than sending it from here keeps the service free of the mail
 * layer, the same way `Registration` does in `AuthService`.
 */
export type ProfileUpdate = {
  user: UserDto;
  pendingEmailToken: string | null;
};

/*
  Who may do what to whom, in one place, because the answer is the same whichever verb
  is being used:

  - The super administrator row is untouchable. Not by an administrator, not by another
    super administrator (there is only one), not by itself. It is seeded and it stays.
  - An `admin` row belongs to the super administrator alone — creating one, promoting
    into the role, demoting out of it, approving, revoking, activating, deactivating.
    Create and promote are the same decision wearing different verbs, so they are one
    rule rather than a list.
  - Nobody changes their own role or their own access. Written about the actor rather
    than the role, so it keeps holding when the role rules next change.
  - At most three active administrators, counted over the `admin` role alone.

  Every one of these is checked here and not in the action, because a Server Action is a
  public endpoint and the screen that hid the button proves nothing about the caller.
*/
export class UserService {
  /**
   * List the department's accounts, newest first, narrowed by the screen's filters.
   *
   * @param filters - Role, status and search text, already validated.
   *
   * @returns Every matching account as a DTO.
   */
  public async list(filters: UserFilters): Promise<ListResult<UserDto>> {
    try {
      await connectToDatabase();

      const users = await User.find(this.buildConditions(filters)).sort({ createdAt: -1 }).lean<UserEntity[]>();

      return listSuccess(users.map(userFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing users failed');

      return listFailure(createError(DATABASE.LIST_FAILED.CODE, DATABASE.LIST_FAILED.MESSAGE));
    }
  }

  /**
   * The named accounts, in one round trip.
   *
   * For attributing rows to the person behind them. A notice carries a publisher's id, and
   * a feed of twenty notices from three administrators should ask about three accounts
   * once rather than twenty times — which is what looping `getById` over a list would do.
   *
   * A missing id is simply absent from the result rather than an error. The caller is
   * labelling somebody else's row, and an account that has since been deleted is a reason
   * to say so on that one card, not to fail the whole screen.
   *
   * @param userIds - Accounts to look up.
   *
   * @returns The accounts that exist, as DTOs.
   */
  public async listByIds(userIds: string[]): Promise<ListResult<UserDto>> {
    try {
      if (userIds.length === 0) {
        return listSuccess([]);
      }

      await connectToDatabase();

      const users = await User.find({ _id: { $in: userIds } }).lean<UserEntity[]>();

      return listSuccess(users.map(userFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing users by id failed');

      return listFailure(createError(DATABASE.LIST_FAILED.CODE, DATABASE.LIST_FAILED.MESSAGE));
    }
  }

  /**
   * The distinct intake sessions the students belong to, sorted.
   *
   * The source for the session-notice picker: rather than typing a batch and risking
   * `2021-22` on one notice and `2021-2022` on the next, a publisher chooses from the
   * intakes that actually exist. Blank and absent sessions are excluded — an account whose
   * session was never set is not an intake anybody addresses.
   *
   * @returns The sessions in use, alphabetically.
   */
  public async listStudentSessions(): Promise<string[]> {
    try {
      await connectToDatabase();

      const sessions = await User.distinct('session', { role: USER_ROLES.STUDENT, session: { $nin: [null, ''] } });

      return (sessions as string[]).filter(Boolean).sort();
    } catch (error) {
      log.error({ err: error }, 'Listing student sessions failed');

      // Fail soft: the picker shows no sessions rather than the screen failing to render.
      return [];
    }
  }

  /**
   * One account, by id.
   *
   * The profile screen's read. It goes to the database rather than to the session token,
   * which carries a name, a role and an approval flag because that is all a guard needs —
   * while a profile has to show every field the department holds, as it stands now rather
   * than as it stood when somebody signed in.
   *
   * @param userId - The account to read.
   *
   * @returns The account, or a failure.
   */
  public async getById(userId: string): Promise<SingleResult<UserDto>> {
    try {
      await connectToDatabase();

      const user = await User.findById(userId).lean<UserEntity | null>();

      if (!user) {
        return this.userNotFound();
      }

      return singleSuccess(userFromEntity(user));
    } catch (error) {
      log.error({ err: error }, 'Reading a user failed');

      return singleFailure(createError(DATABASE.FIND_BY_ID_FAILED.CODE, DATABASE.FIND_BY_ID_FAILED.MESSAGE));
    }
  }

  /**
   * Create an account.
   *
   * The password arrives in plaintext and is handed to the model as-is: hashing lives
   * in the pre-save hook, so this method cannot forget it. The account starts
   * unapproved, which is the model's default — approval is a deliberate second act.
   *
   * @param input - Validated create input.
   * @param requester - The signed-in account making the request.
   *
   * @returns The created account, or a failure naming the field that refused it.
   */
  public async create(input: UserCreateOutput, requester: SessionUser): Promise<SingleResult<UserDto>> {
    try {
      await connectToDatabase();

      const refusal = await this.refuseDisallowedRoleChange(null, input.role, requester);

      if (refusal) {
        return refusal;
      }

      /*
        The division of labour: the super administrator creates administrators, and an
        ordinary administrator creates teachers and students. The gate above already refuses
        an ordinary administrator the `admin` role, so this is its mirror — the one role the
        super administrator may create is `admin`. (Super administrator itself is refused by
        the gate, so it never reaches here.)
      */
      if (requester.role === USER_ROLES.SUPER_ADMIN && input.role !== USER_ROLES.ADMIN) {
        return singleFailure(createError(BUSINESS.SUPER_ADMIN_CREATES_ADMINS_ONLY.CODE, BUSINESS.SUPER_ADMIN_CREATES_ADMINS_ONLY.MESSAGE, 'role'));
      }

      if (input.role === USER_ROLES.ADMIN && !this.optionalText(input.department)) {
        return singleFailure(createError(VALIDATION.DEPARTMENT_REQUIRED.CODE, VALIDATION.DEPARTMENT_REQUIRED.MESSAGE, 'department'));
      }

      if (input.role === USER_ROLES.ADMIN && (await this.isAdminCeilingReached(null, this.optionalText(input.department)))) {
        return this.adminLimitReached();
      }

      const existing = await User.findOne({ email: input.email }).lean<UserEntity | null>();

      if (existing) {
        return singleFailure(createError(VALIDATION.EMAIL_ALREADY_USED.CODE, VALIDATION.EMAIL_ALREADY_USED.MESSAGE, 'email'));
      }

      /*
        An administrator vouching for somebody is the verification — there is no address
        to prove when the account is being made by the department itself. Marking it
        verified matters twice over: an unverified account cannot sign in at all, and the
        pending queue deliberately hides unverified rows, so leaving it false would
        create an account nobody could use and nobody would see waiting.
      */
      const loginId = isIssuableRole(input.role) ? await issueLoginId(input.role) : null;

      if (isIssuableRole(input.role) && !loginId) {
        return singleFailure(createError(BUSINESS.LOGIN_ID_NOT_ISSUED.CODE, BUSINESS.LOGIN_ID_NOT_ISSUED.MESSAGE));
      }

      const created = await User.create({
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role,
        loginId: loginId ?? undefined,
        emailVerified: true,
        designation: this.optionalText(input.designation),
        roll: this.optionalText(input.roll),
        registrationNo: this.optionalText(input.registrationNo),
        session: this.optionalText(input.session),
        department: this.optionalText(input.department),
        semester: this.semesterFor(input.role, input.semester),
        phone: this.optionalText(input.phone),
      });

      return singleSuccess(userFromEntity(created));
    } catch (error) {
      log.error({ err: error }, 'Creating a user failed');

      return singleFailure(createError(DATABASE.CREATE_FAILED.CODE, DATABASE.CREATE_FAILED.MESSAGE));
    }
  }

  /**
   * Update a profile.
   *
   * Email and password are deliberately absent — an email change moves the account's
   * identity and a password change needs its own confirmation, so neither belongs in
   * the same form as a phone number.
   *
   * @param input - Validated update input.
   * @param requester - The signed-in account making the request.
   *
   * @returns The updated account, or a failure.
   */
  public async update(input: UserUpdateOutput, requester: SessionUser): Promise<SingleResult<UserDto>> {
    try {
      await connectToDatabase();

      const target = await User.findById(input.userId).lean<UserEntity | null>();

      if (!target) {
        return this.userNotFound();
      }

      const refusal = await this.refuseDisallowedRoleChange(target, input.role, requester);

      if (refusal) {
        return refusal;
      }

      /*
        A role is set once, at creation, and never moved on edit — not even between teacher
        and student, and not for an administrator. The edit dialog locks the control, and
        this is what makes the lock real for a request that skips the form. Checked after the
        gate so that touching the seeded super administrator, or an administrator an ordinary
        admin may not manage, still answers with its own more specific refusal first.
      */
      if (input.role !== target.role) {
        return singleFailure(createError(BUSINESS.ROLE_IS_IMMUTABLE.CODE, BUSINESS.ROLE_IS_IMMUTABLE.MESSAGE, 'role'));
      }

      /*
        The two admin rules create() enforces are re-checked here, because an edit is another
        way into the same invariant: without this, an admin could be edited to no department at
        all, or moved into a department that already holds its three, defeating the ceiling. A
        Server Action is a public endpoint, so the guard lives in the service, not the form.
      */
      if (target.role === USER_ROLES.ADMIN) {
        const department = this.optionalText(input.department);

        if (!department) {
          return singleFailure(createError(VALIDATION.DEPARTMENT_REQUIRED.CODE, VALIDATION.DEPARTMENT_REQUIRED.MESSAGE, 'department'));
        }

        // Only an active admin moving to a different department can overshoot that department's
        // ceiling; an inactive one is re-checked when it is switched back on.
        if (target.isActive && department !== this.optionalText(target.department) && (await this.isAdminCeilingReached(input.userId, department))) {
          return this.adminLimitReached();
        }
      }

      const updated = await User.findByIdAndUpdate(
        input.userId,
        this.toUpdateDocument({
          name: input.name,
          role: input.role,
          designation: this.optionalText(input.designation),
          roll: this.optionalText(input.roll),
          registrationNo: this.optionalText(input.registrationNo),
          session: this.optionalText(input.session),
          department: this.optionalText(input.department),
          semester: this.semesterFor(input.role, input.semester),
          phone: this.optionalText(input.phone),
        }),
        { returnDocument: 'after' }
      ).lean<UserEntity | null>();

      if (!updated) {
        return this.userNotFound();
      }

      return singleSuccess(userFromEntity(updated));
    } catch (error) {
      log.error({ err: error }, 'Updating a user failed');

      return singleFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * Correct the fields an account holder owns about themselves.
   *
   * Separate from `update()` and not a special case of it, because the two answer
   * different questions. That one asks whether an administrator may change this row; this
   * one never has to ask, since the row is the caller's own — and in exchange it may
   * touch almost nothing. The account is taken from the session rather than the payload,
   * so there is no id to tamper with and no `refuseDisallowedRoleChange` to run: no role
   * is moving, because the schema has no role in it.
   *
   * An email change does not happen here. The address is written to `pendingEmail` and a
   * token is returned for the caller to mail; `email` keeps its old value until the link
   * is clicked. Everything else is applied immediately.
   *
   * @param input - Validated profile input.
   * @param requester - The signed-in account making the request.
   *
   * @returns The updated account and, when the address changed, the token to mail.
   */
  public async updateOwnProfile(input: ProfileUpdateOutput, requester: SessionUser): Promise<SingleResult<ProfileUpdate>> {
    try {
      await connectToDatabase();

      const target = await User.findById(requester.userId).lean<UserEntity | null>();

      if (!target) {
        return singleFailure(createError(VALIDATION.USER_NOT_FOUND.CODE, VALIDATION.USER_NOT_FOUND.MESSAGE));
      }

      const isAddressChanging = input.email !== target.email;

      /*
        A change to the address already pending, asked for again inside the cooldown.

        Without this, one signed-in account is an unbounded mailer aimed at any inbox on
        earth, sending from the department's own relay — `pendingEmail` is deliberately not
        unique, so the address need not be one the sender owns. The victim is a third party
        and the damage is to the sender's reputation.

        Deliberately narrow. Somebody who mistyped must be able to correct it immediately,
        so a change to a *different* address is never throttled, and the name and phone
        alongside it always save. Only asking for the same link twice in quick succession
        is refused — and it is refused by not sending, not by failing: the save succeeded,
        and the link they already have is still valid.

        The row answers this with no new storage, exactly as `reissueVerification` does:
        `pendingEmailExpiresAt` minus the lifetime is when the token was minted.
      */
      const isRepeatOfPending = isAddressChanging && target.pendingEmail === input.email && this.isPendingEmailFresh(target);

      if (isAddressChanging) {
        const taken = await User.findOne({ email: input.email, _id: { $ne: target._id } }).lean<UserEntity | null>();

        if (taken) {
          return singleFailure(createError(VALIDATION.EMAIL_ALREADY_USED.CODE, VALIDATION.EMAIL_ALREADY_USED.MESSAGE, 'email'));
        }
      }

      const pending = isAddressChanging && !isRepeatOfPending ? this.mintPendingEmail(input.email) : null;

      /*
        A save that introduces a new address mints a fresh pending change (replacing any prior
        one); a save that does not — editing a name or phone while the email box still shows
        the current address — leaves any pending change exactly as it is. This used to clear
        the pending fields whenever the submitted address equalled the current one, which
        silently retired an in-flight change the instant the user touched any other field,
        since the box defaults to the current address throughout the pending window. To
        abandon a pending change, enter the correct address (which replaces it) or let it
        expire; a repeat of the pending address, throttled, is likewise left untouched.
      */
      const pendingFields = pending?.fields ?? {};

      const updated = await User.findByIdAndUpdate(
        target._id,
        this.toUpdateDocument({
          name: input.name,
          phone: this.optionalText(input.phone),
          address: this.optionalText(input.address),
          ...pendingFields,
        }),
        { returnDocument: 'after' }
      ).lean<UserEntity | null>();

      if (!updated) {
        return singleFailure(createError(VALIDATION.USER_NOT_FOUND.CODE, VALIDATION.USER_NOT_FOUND.MESSAGE));
      }

      return singleSuccess({ user: userFromEntity(updated), pendingEmailToken: pending?.token ?? null });
    } catch (error) {
      log.error({ err: error }, 'Updating an own profile failed');

      return singleFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * Change the password on the caller's own account.
   *
   * Self-service like `updateOwnProfile`, so there is no id to tamper with and no role to
   * move — the account is the one the session names. Unlike that method it must read the
   * stored hash, so it loads the hydrated document with `.select('+password')` rather than
   * `.lean()`, checks the current password with the model's `comparePassword`, and assigns
   * the new one. Hashing is the pre-save hook's job: assigning the plaintext and saving is
   * the whole of it, and this never calls bcrypt itself.
   *
   * Returns nothing on success — there is no field the caller needs back, and an
   * `EmptyResult` keeps the password hash off every return path.
   *
   * @param input - Validated current/new password.
   * @param requester - The signed-in account making the request.
   *
   * @returns Empty success, or a failure — the current password was wrong, or the account
   *   is gone.
   */
  public async changeOwnPassword(input: ChangePasswordOutput, requester: SessionUser): Promise<EmptyResult> {
    try {
      await connectToDatabase();

      const user = await User.findById(requester.userId).select('+password');

      if (!user) {
        return emptyFailureWithError(createError(VALIDATION.USER_NOT_FOUND.CODE, VALIDATION.USER_NOT_FOUND.MESSAGE));
      }

      const matches = await user.comparePassword(input.currentPassword);

      if (!matches) {
        return emptyFailureWithError(createError(AUTH.CURRENT_PASSWORD_INCORRECT.CODE, AUTH.CURRENT_PASSWORD_INCORRECT.MESSAGE, 'currentPassword'));
      }

      user.password = input.newPassword;
      await user.save();

      return emptySuccess();
    } catch (error) {
      log.error({ err: error }, 'Changing an own password failed');

      return emptyFailureWithError(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * A fresh claim on an address, and the token that proves it.
   *
   * Minting a new one silently retires whatever was pending: the stored hash is
   * overwritten, so the previous link stops working. Asking twice cannot leave two live
   * links pointing at two different addresses.
   *
   * @param email - The address being asked for, already lowercased and trimmed by the schema.
   *
   * @returns The fields to write and the raw token to mail.
   */
  private mintPendingEmail(email: string): { fields: Record<string, unknown>; token: string } {
    const token = randomBytes(EMAIL_VERIFICATION.TOKEN_BYTES).toString('hex');

    return {
      token,
      fields: {
        pendingEmail: email,
        pendingEmailTokenHash: hashToken(token),
        pendingEmailExpiresAt: new Date(Date.now() + EMAIL_VERIFICATION.LIFETIME_HOURS * 60 * 60 * 1000),
      },
    };
  }

  /**
   * Whether the pending-email token on this row was minted recently enough that another
   * message would be a duplicate rather than a correction.
   *
   * Derived from the expiry rather than stored separately: expiry minus lifetime is when
   * it was issued. The same arithmetic `reissueVerification` does, and for the same reason
   * — it needs no new column and behaves identically on one server or ten.
   *
   * @param target - The account as it stands.
   *
   * @returns True when a fresh link was already sent inside the cooldown.
   */
  private isPendingEmailFresh(target: UserEntity): boolean {
    if (!target.pendingEmailExpiresAt) {
      return false;
    }

    const issuedAt = target.pendingEmailExpiresAt.getTime() - EMAIL_VERIFICATION.LIFETIME_HOURS * 60 * 60 * 1000;

    return Date.now() - issuedAt < EMAIL_VERIFICATION.RESEND_COOLDOWN_MINUTES * 60 * 1000;
  }

  /**
   * Approve an account, or take approval back.
   *
   * @param input - Validated approval input.
   * @param requester - The signed-in account making the request.
   *
   * @returns The updated account, or a failure.
   */
  public async setApproval(input: UserApproveOutput, requester: SessionUser): Promise<SingleResult<UserDto>> {
    return this.applyStateChange(input.userId, { isApproved: input.isApproved }, requester);
  }

  /**
   * Switch an account on or off.
   *
   * Deactivation rather than deletion, so schedules and materials keep a valid author.
   *
   * Reactivating counts against the administrator ceiling: three active administrators
   * is the rule, and a fourth arriving through the back door is still a fourth.
   *
   * @param input - Validated activation input.
   * @param requester - The signed-in account making the request.
   *
   * @returns The updated account, or a failure.
   */
  public async setActive(input: UserActivateOutput, requester: SessionUser): Promise<SingleResult<UserDto>> {
    return this.applyStateChange(input.userId, { isActive: input.isActive }, requester);
  }

  /**
   * Delete an account and everything it owns.
   *
   * The opposite of deactivation, and offered alongside it rather than in its place: a
   * departed teacher whose row is only switched off still fills the account list and still
   * holds a login ID, and sometimes the department wants the record gone. This is that,
   * and it is irreversible, so the guard is the same one every mutation goes through —
   * the seeded super administrator is untouchable, an administrator is the super
   * administrator's alone, and nobody deletes their own account.
   *
   * The cascade is deliberate and its scope is what the confirm dialog warns about: the
   * account's own content is removed with its bytes — materials, notices, the class
   * sessions it teaches — so nothing is left in storage pointing at a row that no longer
   * exists. Courses are the exception: they are department assets a teacher was merely
   * assigned, so they are unassigned rather than deleted, and outlive whoever taught them.
   *
   * @param userId - The account to delete.
   * @param requester - The signed-in account making the request.
   *
   * @returns Empty success, or a failure.
   */
  public async delete(userId: string, requester: SessionUser): Promise<EmptyResult> {
    try {
      await connectToDatabase();

      const target = await User.findById(userId).lean<UserEntity | null>();

      if (!target) {
        return emptyFailureWithError(createError(VALIDATION.USER_NOT_FOUND.CODE, VALIDATION.USER_NOT_FOUND.MESSAGE));
      }

      if (target.role === USER_ROLES.SUPER_ADMIN) {
        return emptyFailureWithError(createError(BUSINESS.SUPER_ADMIN_IS_IMMUTABLE.CODE, BUSINESS.SUPER_ADMIN_IS_IMMUTABLE.MESSAGE));
      }

      if (target.role === USER_ROLES.ADMIN && requester.role !== USER_ROLES.SUPER_ADMIN) {
        return emptyFailureWithError(createError(AUTH.ADMIN_MANAGED_BY_SUPER_ADMIN.CODE, AUTH.ADMIN_MANAGED_BY_SUPER_ADMIN.MESSAGE));
      }

      // Deleting yourself is the access half of "nobody changes their own access", made permanent.
      if (toId(target._id) === requester.userId) {
        return emptyFailureWithError(createError(BUSINESS.CANNOT_CHANGE_OWN_ACCESS.CODE, BUSINESS.CANNOT_CHANGE_OWN_ACCESS.MESSAGE));
      }

      /*
       * A course and timetable row are departmental commitments. Deleting their teacher
       * must not silently turn them into unassigned work or erase students' routine, so
       * the administrator transfers them through the existing course/schedule editors
       * before removing the account.
       */
      if (target.role === USER_ROLES.TEACHER) {
        const [courseCount, classCount] = await Promise.all([
          Course.countDocuments({ assignedTeacher: userId }),
          ClassSession.countDocuments({ teacher: userId }),
        ]);
        if (courseCount > 0 || classCount > 0) {
          return emptyFailureWithError(
            createError(BUSINESS.TEACHER_ASSIGNMENTS_MUST_BE_TRANSFERRED.CODE, BUSINESS.TEACHER_ASSIGNMENTS_MUST_BE_TRANSFERRED.MESSAGE)
          );
        }
      }

      await this.purgeOwnedContent(userId);

      // The row last, so a cascade interrupted midway leaves the account present to retry against.
      await User.findByIdAndDelete(userId);

      return emptySuccess();
    } catch (error) {
      log.error({ err: error }, 'Deleting a user failed');

      return emptyFailureWithError(createError(DATABASE.DELETE_FAILED.CODE, DATABASE.DELETE_FAILED.MESSAGE));
    }
  }

  /**
   * Remove the content an account owns, bytes and all.
   *
   * Rows are read for their storage keys before they are deleted, then the bytes behind
   * them are released — the same row-then-bytes discipline `MaterialService` and
   * `NoticeService` keep for a single item, done here in bulk. A key that is already gone
   * is not an error, so a half-finished previous attempt does not block a retry.
   *
   * @param userId - The account whose content is being removed.
   */
  private async purgeOwnedContent(userId: string): Promise<void> {
    const materials = await Material.find({ uploadedBy: userId }).lean<{ storageKey: string }[]>();

    await Material.deleteMany({ uploadedBy: userId });
    await Promise.all(materials.map(x => storage.remove(x.storageKey)));

    const notices = await Notice.find({ publishedBy: userId }).lean<{ image?: { storageKey: string } }[]>();

    await Notice.deleteMany({ publishedBy: userId });
    // `flatMap` narrows `image` inside the guard, where a filter-then-map would not.
    await Promise.all(notices.flatMap(x => (x.image ? [storage.remove(x.image.storageKey)] : [])));
  }

  /**
   * Apply an approval or activation change, after checking the requester is allowed to
   * make it against this particular account.
   *
   * Both flags go through here because both answer the same question — may this account
   * sign in — so both are governed by the same rules.
   *
   * @param userId - Account being changed.
   * @param change - The single flag to write.
   * @param requester - The signed-in account making the request.
   *
   * @returns The updated account, or a failure.
   */
  private async applyStateChange(
    userId: string,
    change: Partial<Pick<UserAttributes, 'isApproved' | 'isActive'>>,
    requester: SessionUser
  ): Promise<SingleResult<UserDto>> {
    try {
      await connectToDatabase();

      const target = await User.findById(userId).lean<UserEntity | null>();

      if (!target) {
        return this.userNotFound();
      }

      // The role is not changing here, so the target's own role is both sides of the check.
      const refusal = await this.refuseDisallowedRoleChange(target, target.role, requester);

      if (refusal) {
        return refusal;
      }

      /*
        The access half of "nobody changes their own role or access". Approval and
        activation carry no role for the shared gate to compare, so the self-check is
        made here — and it is unconditional, because both flags decide whether this
        account can sign in tomorrow.
      */
      if (toId(target._id) === requester.userId) {
        return this.ownAccess();
      }

      /*
        Switching an administrator back on is the same act as creating one, as far as the
        ceiling is concerned — the department ends up with a fourth either way.
      */
      if (change.isActive === true && target.role === USER_ROLES.ADMIN && (await this.isAdminCeilingReached(userId, target.department))) {
        return this.adminLimitReached();
      }

      const updated = await User.findByIdAndUpdate(userId, change, { returnDocument: 'after' }).lean<UserEntity | null>();

      if (!updated) {
        return this.userNotFound();
      }

      return singleSuccess(userFromEntity(updated));
    } catch (error) {
      log.error({ err: error }, 'Changing a user state failed');

      return singleFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * Translate the screen's filters into a Mongo query.
   *
   * The three states partition the table rather than overlapping: an account is
   * waiting for approval, usable, or switched off — never two at once.
   *
   * @param filters - Role, status and search text.
   *
   * @returns Conditions for `User.find()`.
   */
  private buildConditions(filters: UserFilters): QueryFilter<UserAttributes> {
    const conditions: QueryFilter<UserAttributes> = {};

    if (filters.role !== FILTER_ALL) {
      conditions.role = filters.role;
    }

    /*
      Waiting for approval means waiting for a *person*, so an application whose address
      has not been proven does not belong in the queue — an administrator should not
      spend attention on somebody who may never come back and confirm. Unverified rows
      are still visible under "all"; they are just not presented as work.

      Accounts an administrator created carry `emailVerified: true` from the start, so
      this narrows the self-registered ones only.
    */
    if (filters.status === USER_STATUS_FILTERS.PENDING) {
      conditions.isApproved = false;
      conditions.isActive = true;
      conditions.emailVerified = true;
    }

    if (filters.status === USER_STATUS_FILTERS.ACTIVE) {
      conditions.isApproved = true;
      conditions.isActive = true;
    }

    if (filters.status === USER_STATUS_FILTERS.INACTIVE) {
      conditions.isActive = false;
    }

    if (filters.query) {
      // Escaped, because the raw value comes from a search box and a URL.
      const pattern = new RegExp(escapeRegExp(filters.query), 'i');

      conditions.$or = [{ name: pattern }, { email: pattern }];
    }

    return conditions;
  }

  /**
   * The one gate every mutating method goes through.
   *
   * Takes the account as it stands and the role it is heading for, so create, edit,
   * promote, demote, approve, revoke, activate and deactivate all ask the same question
   * — and cannot answer it differently. A create passes `null` for the target; a state
   * change passes the target's own role on both sides, because nothing is moving.
   *
   * @param target - The account being changed, or null when one is being created.
   * @param nextRole - The role it will hold afterwards.
   * @param requester - The signed-in account making the request.
   *
   * @returns A failure to return, or null when the request is allowed.
   */
  private async refuseDisallowedRoleChange(
    target: UserEntity | null,
    nextRole: UserRole,
    requester: SessionUser
  ): Promise<SingleResult<UserDto> | null> {
    const isSuperAdmin = requester.role === USER_ROLES.SUPER_ADMIN;

    // Nothing reaches the seeded account, and nothing is ever promoted into its role.
    if (target?.role === USER_ROLES.SUPER_ADMIN || nextRole === USER_ROLES.SUPER_ADMIN) {
      return singleFailure(createError(BUSINESS.SUPER_ADMIN_IS_IMMUTABLE.CODE, BUSINESS.SUPER_ADMIN_IS_IMMUTABLE.MESSAGE));
    }

    /*
      An administrator account is the super administrator's alone, whether it is being
      made, unmade, or merely switched off. Both sides are checked: leaving the role is
      as much an administrator decision as entering it.
    */
    if (!isSuperAdmin && (target?.role === USER_ROLES.ADMIN || nextRole === USER_ROLES.ADMIN)) {
      return singleFailure(createError(AUTH.ADMIN_MANAGED_BY_SUPER_ADMIN.CODE, AUTH.ADMIN_MANAGED_BY_SUPER_ADMIN.MESSAGE));
    }

    /*
      Nobody moves their own role. Deliberately narrow: editing your own name or phone
      through this screen is fine, and demoting yourself is not. The access half of the
      same rule lives in `applyStateChange`, because approval and activation carry no
      role to compare.
    */
    if (target && toId(target._id) === requester.userId && nextRole !== target.role) {
      return this.ownAccess();
    }

    return null;
  }

  /**
   * Whether the department already has as many active administrators as it may have.
   *
   * Counted over the `admin` role alone — the super administrator is not one of the
   * three. Deactivated administrators are not counted, so switching one off frees the
   * seat for a replacement; otherwise a department that loses someone could never fill
   * the gap, because accounts are deactivated rather than deleted.
   *
   * @param excludeUserId - An account to leave out of the count, or null.
   *
   * @returns True when no further administrator may be activated.
   */
  private async isAdminCeilingReached(excludeUserId: string | null, department: string | undefined): Promise<boolean> {
    /*
      Without a concrete department there is nothing to scope the count to, and `{ department:
      undefined }` counts the wrong cohort (every department-less admin, or all of them). An
      admin must have a department - create() and update() enforce it - so the missing case is
      treated as full rather than counted, failing closed.
    */
    if (!department) {
      return true;
    }

    const conditions: QueryFilter<UserAttributes> = { role: USER_ROLES.ADMIN, isActive: true, department };

    if (excludeUserId) {
      conditions._id = { $ne: excludeUserId };
    }

    return (await User.countDocuments(conditions)) >= ADMIN_LIMIT;
  }

  /**
   * An untouched optional input submits an empty string. Store nothing instead, so the
   * DTO reports `null` rather than an empty value that reads as deliberate.
   *
   * @param value - Raw optional field.
   *
   * @returns The trimmed text, or undefined when it was blank.
   */
  private optionalText(value: string | undefined): string | undefined {
    return value ? value : undefined;
  }

  /**
   * A semester belongs to a student and to nobody else.
   *
   * Dropped rather than stored for the other two roles, so promoting a student to a
   * teacher cannot leave a year behind on the record — invisible on every screen, and
   * still there for anything that later reads the field.
   *
   * @param role - The role being saved.
   * @param semester - Semester from the form, already validated.
   *
   * @returns The semester to store, or undefined.
   */
  private semesterFor(role: UserRole, semester: number | undefined): number | undefined {
    return role === USER_ROLES.STUDENT ? semester : undefined;
  }

  /**
   * Turn a set of field values into the update Mongo actually applies.
   *
   * Mongoose drops `undefined` keys from an update rather than clearing the field, so
   * emptying an optional input would otherwise be a silent no-op: the form would say
   * the designation was gone while the record still held it. Present values are
   * written with `$set`, absent ones removed with `$unset`.
   *
   * @param fields - The values the form produced, `undefined` meaning "no longer set".
   *
   * @returns An update document that both writes and clears.
   */
  private toUpdateDocument(fields: Record<string, unknown>): UpdateQuery<UserAttributes> {
    const assigned: Record<string, unknown> = {};
    const cleared: Record<string, ''> = {};

    Object.entries(fields).forEach(([field, value]) => {
      if (value === undefined) {
        cleared[field] = '';

        return;
      }

      assigned[field] = value;
    });

    // An empty `$unset` is rejected by the driver, so it is only included when it has work.
    return Object.keys(cleared).length > 0 ? { $set: assigned, $unset: cleared } : { $set: assigned };
  }

  private userNotFound(): SingleResult<UserDto> {
    return singleFailure(createError(VALIDATION.USER_NOT_FOUND.CODE, VALIDATION.USER_NOT_FOUND.MESSAGE));
  }

  private ownAccess(): SingleResult<UserDto> {
    return singleFailure(createError(BUSINESS.CANNOT_CHANGE_OWN_ACCESS.CODE, BUSINESS.CANNOT_CHANGE_OWN_ACCESS.MESSAGE));
  }

  private adminLimitReached(): SingleResult<UserDto> {
    return singleFailure(createError(BUSINESS.ADMIN_LIMIT_REACHED.CODE, BUSINESS.ADMIN_LIMIT_REACHED.MESSAGE, 'role'));
  }
}
