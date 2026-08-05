import { cookies } from 'next/headers';

import { SessionUser } from '@/types';

import { SESSION } from '@/constants/auth.const';

import { createSessionToken } from './session';

const production = process.env.NODE_ENV === 'production';

/**
 * Sign the visitor in by writing the session cookie.
 *
 * `httpOnly` keeps the token away from any script on the page, which is what stops a
 * cross-site scripting bug from turning into a stolen session. `sameSite: lax` stops
 * another site posting to ours with the visitor's cookie attached.
 *
 * @param user - Who the session belongs to.
 */
export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  const store = await cookies();

  store.set(SESSION.COOKIE.NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: production,
    path: '/',
    maxAge: SESSION.COOKIE.MAX_AGE,
  });
}

/**
 * Sign the visitor out by removing the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();

  store.delete(SESSION.COOKIE.NAME);
}
