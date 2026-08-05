import { CODES } from '@/constants/codes.const';

const AUTH = CODES.AUTH.USERS;

export type SignInErrorLabels = {
  invalidCredentials: string;
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

  if (code === AUTH.ACCOUNT_NOT_APPROVED.CODE) {
    return labels.notApproved;
  }

  if (code === AUTH.ACCOUNT_DEACTIVATED.CODE) {
    return labels.deactivated;
  }

  return labels.unexpected;
}
