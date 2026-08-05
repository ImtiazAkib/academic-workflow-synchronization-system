import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';

import type { UserDto, UserRole, UserStatusFilter } from '@/types';

const VALIDATION = CODES.VALIDATION.USERS;
const BUSINESS = CODES.BUSINESS.USERS;

/**
 * One of the three account states, with "no filter" excluded — a row is always in
 * exactly one of them.
 */
export type UserStatus = Exclude<UserStatusFilter, 'all'>;

export type UserRoleLabels = {
  admin: string;
  teacher: string;
  student: string;
};

export type UserStatusLabels = {
  pending: string;
  active: string;
  inactive: string;
};

export type UserErrorLabels = {
  emailTaken: string;
  lastAdministrator: string;
  notFound: string;
  generic: string;
};

/**
 * Turn a refusal code from a user action into a sentence the administrator reads.
 *
 * Actions return codes rather than sentences because only the client holds the
 * translated strings — they arrive as props from the page.
 *
 * @param code - Error code from the failed action.
 * @param labels - Translated messages, one per refusal.
 *
 * @returns The message to show.
 */
export function resolveUserErrorMessage(code: number, labels: UserErrorLabels): string {
  if (code === VALIDATION.EMAIL_ALREADY_USED.CODE) {
    return labels.emailTaken;
  }

  if (code === BUSINESS.LAST_ADMIN_CANNOT_BE_REMOVED.CODE) {
    return labels.lastAdministrator;
  }

  if (code === VALIDATION.USER_NOT_FOUND.CODE) {
    return labels.notFound;
  }

  return labels.generic;
}

/**
 * Which of the three states an account is in.
 *
 * Stored as two independent booleans, shown as one badge — deactivation wins over
 * approval, because an account that is switched off cannot sign in whatever its
 * approval says.
 *
 * @param user - The account to classify.
 *
 * @returns The single state the row displays.
 */
export function resolveUserStatus(user: Pick<UserDto, 'isApproved' | 'isActive'>): UserStatus {
  if (!user.isActive) {
    return 'inactive';
  }

  if (!user.isApproved) {
    return 'pending';
  }

  return 'active';
}

/**
 * The already-translated label for a role.
 *
 * Takes the strings rather than a translator, so it works in a client component that
 * was handed its copy as props.
 *
 * @param role - The role to label.
 * @param labels - Translated role names.
 *
 * @returns The label to render.
 */
export function resolveUserRoleLabel(role: UserRole, labels: UserRoleLabels): string {
  if (role === USER_ROLES.ADMIN) {
    return labels.admin;
  }

  if (role === USER_ROLES.TEACHER) {
    return labels.teacher;
  }

  return labels.student;
}

/**
 * The already-translated label for an account state.
 *
 * @param status - The state to label.
 * @param labels - Translated state names.
 *
 * @returns The label to render.
 */
export function resolveUserStatusLabel(status: UserStatus, labels: UserStatusLabels): string {
  if (status === 'pending') {
    return labels.pending;
  }

  if (status === 'inactive') {
    return labels.inactive;
  }

  return labels.active;
}
