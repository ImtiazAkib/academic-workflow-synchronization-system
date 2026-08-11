import { CODES } from '@/constants/codes.const';

const AUTH = CODES.AUTH.USERS;
const BUSINESS_COMMON = CODES.BUSINESS.COMMON;
const VALIDATION = CODES.VALIDATION.USERS;

export type SignInErrorLabels = {
  invalidCredentials: string;
  useLoginId: string;
  notVerified: string;
  notApproved: string;
  deactivated: string;
  tooManyAttempts: string;
  unexpected: string;
};

/**
 * Turn a refusal code from the sign-in action into a sentence the visitor reads.
 *
 * The action returns a code rather than a message because only the client holds the
 * translated strings for that form — the labels arrive as props from the page.
 *
 * @param code - Error code from the failed sign-in.
 * @param labels - Translated messages, one per refusal.
 *
 * @returns The message to show.
 */
export function resolveSignInErrorMessage(code: number, labels: SignInErrorLabels): string {
  if (code === AUTH.INVALID_CREDENTIALS.CODE) {
    return labels.invalidCredentials;
  }

  /*
    Named rather than collapsed into "unexpected", because it is the one refusal here that
    somebody can act on by doing nothing. Told they are throttled, a person waits; told
    something went wrong, they keep trying — and every retry pushes the window out.
  */
  if (code === BUSINESS_COMMON.TOO_MANY_REQUESTS.CODE) {
    return labels.tooManyAttempts;
  }

  if (code === AUTH.SIGN_IN_WITH_LOGIN_ID.CODE) {
    return labels.useLoginId;
  }
  /*
    Kept distinct from "not approved". One is the visitor's to fix — the link is in
    their inbox — and the other is the department's. A single message for both would
    leave half of them with nothing to do.
  */
  if (code === AUTH.EMAIL_NOT_VERIFIED.CODE) {
    return labels.notVerified;
  }

  if (code === AUTH.ACCOUNT_NOT_APPROVED.CODE) {
    return labels.notApproved;
  }

  if (code === AUTH.ACCOUNT_DEACTIVATED.CODE) {
    return labels.deactivated;
  }

  return labels.unexpected;
}

export type RegistrationErrorLabels = {
  emailTaken: string;
  rollTaken: string;
  tooManyAttempts: string;
  generic: string;
};

/**
 * Turn a refusal from a registration action into a sentence the applicant reads.
 *
 * Only the two refusals worth naming get their own message. Everything else — a
 * too-long field, a malformed email, a database fault — collapses to the generic one,
 * because the form has already shown the field-level errors and an anonymous visitor is
 * the last person who should be handed the internals.
 *
 * @param code - Error code from the failed registration.
 * @param labels - Translated messages.
 *
 * @returns The message to show.
 */
export function resolveRegistrationErrorMessage(code: number, labels: RegistrationErrorLabels): string {
  if (code === VALIDATION.EMAIL_ALREADY_USED.CODE) {
    return labels.emailTaken;
  }

  if (code === VALIDATION.ROLL_ALREADY_USED.CODE) {
    return labels.rollTaken;
  }

  if (code === BUSINESS_COMMON.TOO_MANY_REQUESTS.CODE) {
    return labels.tooManyAttempts;
  }

  return labels.generic;
}

export type EmailRequestErrorLabels = {
  notRegistered: string;
  invalidEmail: string;
  tooManyAttempts: string;
  generic: string;
};

/**
 * Turn a refusal from an email-request action — resend confirmation, forgot password —
 * into a sentence the visitor reads.
 *
 * Both screens now name an unregistered address, the department's deliberate choice over
 * the old silent "check your inbox". Shared because the two say the same four things; the
 * copy differs and arrives as labels, so one resolver serves both.
 *
 * @param code - Error code from the failed request.
 * @param labels - Translated messages, one per refusal.
 *
 * @returns The message to show.
 */
export function resolveEmailRequestErrorMessage(code: number, labels: EmailRequestErrorLabels): string {
  if (code === VALIDATION.EMAIL_NOT_REGISTERED.CODE) {
    return labels.notRegistered;
  }

  if (code === VALIDATION.EMAIL_INVALID.CODE) {
    return labels.invalidEmail;
  }

  if (code === BUSINESS_COMMON.TOO_MANY_REQUESTS.CODE) {
    return labels.tooManyAttempts;
  }

  return labels.generic;
}

export type VerificationErrorLabels = {
  invalidTitle: string;
  invalidDescription: string;
  expiredTitle: string;
  expiredDescription: string;
};

/**
 * Which of the two failure screens a bad verification link earns.
 *
 * Expired and invalid are told apart because the remedy differs: an expired link means
 * register again for a fresh one, an invalid link usually means it was already used and
 * the account is fine.
 *
 * @param code - Error code from the failed verification.
 * @param labels - Translated messages.
 *
 * @returns The title and description to render.
 */
export function resolveVerificationFailure(code: number, labels: VerificationErrorLabels): { title: string; description: string } {
  if (code === VALIDATION.VERIFICATION_LINK_EXPIRED.CODE) {
    return { title: labels.expiredTitle, description: labels.expiredDescription };
  }

  return { title: labels.invalidTitle, description: labels.invalidDescription };
}

export type EmailChangeErrorLabels = VerificationErrorLabels & {
  takenTitle: string;
  takenDescription: string;
};

/**
 * Which failure screen a bad email-change link earns.
 *
 * The same two link failures as registration, reusing their codes because the sentences
 * are the same sentences, plus one that only exists here: the address was claimed by
 * somebody else between asking and confirming. That one needs its own message because it
 * is the only failure the visitor cannot fix by clicking again — the remedy is a
 * different address, and a screen that said "not valid" would send them back to their
 * inbox to re-click a link that will never work.
 *
 * @param code - Error code from the failed confirmation.
 * @param labels - Translated messages.
 *
 * @returns The title and description to render.
 */
export function resolveEmailChangeFailure(code: number, labels: EmailChangeErrorLabels): { title: string; description: string } {
  if (code === VALIDATION.EMAIL_ALREADY_USED.CODE) {
    return { title: labels.takenTitle, description: labels.takenDescription };
  }

  return resolveVerificationFailure(code, labels);
}
