import { SessionUser } from '@/types';

import { CODES } from '@/constants/codes.const';
import { ADMIN_AREA_ROLES } from '@/constants/roles.const';

import { SingleResult, createError, singleFailure } from '@/lib/result';

import { getSessionUser } from './current-user';

const AUTH = CODES.AUTH.COMMON;

/**
 * Either the account making the request, or the refusal to return instead.
 *
 * A discriminated union rather than a nullable pair, so an action that forgets to check
 * cannot reach the requester — the type will not let it. Generic in the DTO because the
 * refusal has to be shaped like whatever the action returns.
 */
export type AdminAreaGate<T> = { allowed: true; requester: SessionUser } | { allowed: false; refusal: SingleResult<T> };

/**
 * Admit a Server Action's caller to the admin area, or refuse them.
 *
 * Every action re-checks the session itself: a Server Action is a public endpoint, and
 * the page guard that hid the button proves nothing about who is calling it. It returns
 * a Result rather than redirecting the way `requireAdminArea` does — `getLocale()` reads
 * `next/root-params`, which is unavailable inside a Server Action, and a refusal the
 * dialog can render beats a redirect it cannot follow.
 *
 * **One definition, shared by every admin action file.** It used to be a
 * `refuseNonAdministrator()` copied into three of them, each testing `role === 'admin'`.
 * When the super administrator arrived, one copy was widened and two were not — so the
 * account that owns the course and schedule screens could open them and have every write
 * refused. Three copies of an authorization rule is three chances to update two.
 *
 * It answers "may you be in this area at all". Which account is asking, and what that
 * lets them do to a particular row, is the service's decision.
 *
 * @returns The caller, or the refusal to return in their place.
 */
export async function gateAdminArea<T>(): Promise<AdminAreaGate<T>> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return { allowed: false, refusal: singleFailure(createError(AUTH.NOT_AUTHENTICATED.CODE, AUTH.NOT_AUTHENTICATED.MESSAGE)) };
  }

  if (!ADMIN_AREA_ROLES.some(role => role === sessionUser.role)) {
    return { allowed: false, refusal: singleFailure(createError(AUTH.NOT_AUTHORIZED.CODE, AUTH.NOT_AUTHORIZED.MESSAGE)) };
  }

  return { allowed: true, requester: sessionUser };
}
