import { UserRole } from './user-role';

/**
 * The account states the admin screen filters by.
 *
 * Derived rather than stored: a row carries `isApproved` and `isActive`, and these are
 * the meaningful combinations of the two — waiting for approval, approved and usable,
 * or switched off — plus "no filter".
 */
export type UserStatusFilter = 'all' | 'pending' | 'active' | 'inactive';

/**
 * Role filter for the same screen: every role, or exactly one.
 */
export type UserRoleFilter = 'all' | UserRole;

/**
 * What the users screen narrows the list by. Every field has a default, so the
 * unfiltered screen and a hand-edited URL both resolve to something valid.
 */
export type UserFilters = {
  role: UserRoleFilter;
  status: UserStatusFilter;
  query: string;
};
