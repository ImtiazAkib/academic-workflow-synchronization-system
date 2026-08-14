import { cookies } from 'next/headers';

import { User } from '@/models/user.model';
import { SessionUser } from '@/types';

import { SESSION } from '@/constants/auth.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';

import { verifySessionToken } from './session';

import type { UserEntity } from '@/models/user.model';

const log = createLoggerWithContext('current-user');

/**
 * Read the current session in a server component, layout or route handler.
 *
 * The token alone is not trusted. A signed token proves who signed in and when, but not
 * that the account is still active, still approved, or still holds the role the token
 * claims — an administrator may have deactivated it, revoked its approval, or changed its
 * role in the meantime. So the live row is loaded and checked on every call, which is what
 * makes those actions take effect at once rather than waiting up to an hour for the token
 * to expire. The returned name/email/role come from the row, not the stale token.
 *
 * This runs only in the Node runtime (it reads `next/headers` and touches Mongoose); the
 * edge middleware verifies the signature alone. If the database cannot be reached the check
 * fails open to the verified token rather than closed, so a momentary blip cannot sign the
 * whole department out — the one-hour token lifetime still bounds the exposure.
 *
 * @returns The signed-in user, or null when there is no valid session.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION.COOKIE.NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  try {
    await connectToDatabase();

    const account = await User.findById(session.userId).select('name email role isActive isApproved').lean<UserEntity | null>();

    // Deleted, deactivated, de-approved, or role changed since the token was minted — the
    // session is no longer valid, regardless of how long the token has left to run.
    if (!account || !account.isActive || !account.isApproved || account.role !== session.role) {
      return null;
    }

    return { userId: session.userId, email: account.email, name: account.name, role: account.role, isApproved: account.isApproved };
  } catch (error) {
    // Fail open on a DB error so an outage cannot lock everyone out; the one-hour token
    // lifetime still caps the window, and revocation resumes once the DB is reachable.
    log.warn({ err: error }, 'Re-validating a session against the database failed; trusting the token');

    return session;
  }
}
