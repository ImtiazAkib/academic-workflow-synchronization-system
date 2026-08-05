// Type-only: `@/types` reaches back into `@/lib/utils`, and a value import here would
// close that loop into a runtime import cycle.
import type { UserRoleFilter, UserStatusFilter } from '@/types';

/**
 * The "no filter" option, shared by the role and status selects. One constant rather
 * than a loose `'all'` in five places, because it is also the default in the URL
 * schema and the value the selects reset to.
 */
export const FILTER_ALL = 'all';

export const USER_STATUS_FILTERS = {
  ALL: FILTER_ALL,
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const satisfies Record<string, UserStatusFilter>;

export const USER_ROLE_FILTERS = {
  ALL: FILTER_ALL,
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const satisfies Record<string, UserRoleFilter>;

/**
 * Longest search string accepted from the URL. Not a security boundary — the value is
 * escaped before it reaches Mongo — just a bound on what a hand-edited query can ask
 * the database to scan.
 */
export const USER_QUERY_MAX_LENGTH = 120;
