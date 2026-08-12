'use server';

import { hasLocale } from 'next-intl';

import { redirect } from '@/l10n/navigation';
import { routing } from '@/l10n/routing';
import { UserRole } from '@/types';

import { SESSION } from '@/constants/auth.const';
import { CODES } from '@/constants/codes.const';
import { DEFAULT_APP_LOCALE } from '@/constants/i18n.const';
import { ROUTES } from '@/constants/routes.const';

import { clearSessionCookie, setSessionCookie } from '@/lib/auth';
import { SingleResult, createError, isSuccess, singleFailureWithErrors, singleSuccess } from '@/lib/result';
import { SignInSchema } from '@/lib/schemas';
import { AuthService } from '@/lib/services';
import { mapZodErrorsToErrorDto } from '@/lib/utils';

const AUTH = CODES.AUTH.USERS;

const authService = new AuthService();

/**
 * Sign in with a login ID or an email address, and a password.
 *
 * One field for all three roles: a student types `S-2026-0042`, a teacher
 * `T-2026-0007`, an administrator their email. The service decides which lookup that
 * shape calls for, whether the credentials are good, and why not; this action only
 * validates the shape, then turns a successful verification into a session cookie.
 *
 * @param values - Raw form values, validated here rather than trusted.
 *
 * @returns Empty result — success, or a failure carrying the reason's code.
 */
export async function signInAction(values: unknown): Promise<SingleResult<UserRole>> {
  const validation = SignInSchema.safeParse(values);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  const result = await authService.verifyCredentials(validation.data.identifier, validation.data.password);

  if (!isSuccess(result) || !result.result) {
    const errors = result.errors.length > 0 ? result.errors : [createError(AUTH.SIGN_IN_FAILED.CODE, AUTH.SIGN_IN_FAILED.MESSAGE)];

    return singleFailureWithErrors(errors);
  }

  const user = result.result;

  await setSessionCookie({
    userId: user.userId,
    email: user.email,
    name: user.name,
    role: user.role,
    isApproved: user.isApproved,
  });

  /*
    The role comes back rather than a destination. `ROLE_HOME` is a literal union, so
    the client navigates to a route `typedRoutes` already knows — no string is built
    from user input, which is what an open redirect is made of.
  */
  return singleSuccess(user.role);
}

/**
 * Sign out and return to the sign-in page in the current language.
 *
 * The locale arrives as a hidden form field rather than being looked up: Server
 * Actions cannot read `next/root-params`. It is validated here because a form field
 * is user input, whatever put it there.
 *
 * @param formData - Submitted form, carrying the locale field.
 */
export async function signOutAction(formData: FormData): Promise<void> {
  await clearSessionCookie();

  const submitted = formData.get(SESSION.LOCALE_FIELD);
  const locale = hasLocale(routing.locales, submitted) ? submitted : DEFAULT_APP_LOCALE;

  redirect({ href: ROUTES.SIGN_IN.HREF, locale });
}
