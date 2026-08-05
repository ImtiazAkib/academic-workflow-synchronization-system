import { cookies } from 'next/headers';

import { SessionUser } from '@/types';

import { SESSION } from '@/constants/auth.const';

import { verifySessionToken } from './session';

/**
 * Read the current session in a server component, layout or route handler.
 *
 * @returns The signed-in user, or null when there is no valid session.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION.COOKIE.NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}
