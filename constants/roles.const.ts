import { UserRole } from '@/types';

export const USER_ROLES = {
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const satisfies Record<string, UserRole>;

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  'super-admin': 'Super administrator',
  admin: 'Administrator',
  teacher: 'Teacher',
  student: 'Student',
};

/**
 * The roles that may enter the admin area.
 *
 * The super administrator holds every administrator power and then some, so the guard
 * asks "may this account be here" rather than "is this account an administrator" -
 * `requireRole(ADMIN)` would turn the one account that owns the area away from it.
 */
export const ADMIN_AREA_ROLES = [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN] as const satisfies readonly UserRole[];

/**
 * How many active administrators the department may have at once.
 *
 * The super administrator is not one of them - three plus one, four accounts with
 * administrative reach in total. Counted over the `admin` role alone, so the arithmetic
 * cannot be read two ways.
 */
export const ADMIN_LIMIT = 3;
