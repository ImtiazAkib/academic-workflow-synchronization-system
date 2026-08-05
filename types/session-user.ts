import { UserRole } from './user-role';

/**
 * Who the current request belongs to.
 *
 * Everything here rides inside the session token, so a guarded page knows the role
 * without a database round trip. Keep it small — it is re-sent on every request, and
 * anything stored here is stale until the visitor signs in again.
 */
export type SessionUser = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  isApproved: boolean;
};
