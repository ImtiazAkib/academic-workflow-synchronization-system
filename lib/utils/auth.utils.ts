import { CODES } from '@/constants/codes.const';

const AUTH = CODES.AUTH.USERS;
const VALIDATION = CODES.VALIDATION.USERS;

export type SignInErrorLabels = {
  invalidCredentials: string;
  useLoginId: string;
  notVerified: string;
  notApproved: string;
  deactivated: string;
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
