import { getLocale } from 'next-intl/server';

import { redirect } from '@/l10n/navigation';
import { SessionUser, UserRole } from '@/types';

import { ROUTES } from '@/constants/routes.const';

import { getSessionUser } from './current-user';

type GuardRedirectHref = typeof ROUTES.SIGN_IN.HREF | typeof ROUTES.UNAUTHORIZED.HREF;
type GuardLocale = Awaited<ReturnType<typeof getLocale>>;

/*
  Synchronous on purpose. `redirect` interrupts rendering by throwing, but next-intl
  does not type it as returning `never` — hence the throw below, which is unreachable
  and exists only to give this function a `never` return.

  It has to be synchronous because awaiting a `Promise<never>` does not narrow control
  flow: the compiler would still believe execution continues past the guard, and every
  caller would be handed `SessionUser | null`.
*/
function redirectTo(href: GuardRedirectHref, locale: GuardLocale): never {
  redirect({ href, locale });

  throw new Error(`Redirect to ${href} did not interrupt rendering`);
}

/**
 * Require a signed-in visitor.
 *
 * Redirects rather than returning null, so a caller cannot forget to handle the
 * unauthenticated case and render a page to nobody.
 *
 * @returns The signed-in user.
 */
export async function requireSession(): Promise<SessionUser> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    const locale = await getLocale();

    redirectTo(ROUTES.SIGN_IN.HREF, locale);
  }

  return sessionUser;
}

/**
 * Require a signed-in visitor holding a specific role.
 *
 * The wrong role is a different answer from no session at all: one is "sign in", the
 * other is "you are signed in and still may not be here". Sending both to the sign-in
 * page would tell an already-authenticated teacher to sign in again, which reads as a
 * bug rather than a refusal.
 *
 * @param role - The role this area belongs to.
 *
 * @returns The signed-in user.
 */
export async function requireRole(role: UserRole): Promise<SessionUser> {
  const sessionUser = await requireSession();

  if (sessionUser.role !== role) {
    const locale = await getLocale();

    redirectTo(ROUTES.UNAUTHORIZED.HREF, locale);
  }

  return sessionUser;
}
