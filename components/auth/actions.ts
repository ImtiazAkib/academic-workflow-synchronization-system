'use server';

import { getLocale } from 'next-intl/server';

import { redirect } from '@/l10n/navigation';

import { CODES } from '@/constants/codes.const';
import { ROUTES } from '@/constants/routes.const';

import { clearSessionCookie, setSessionCookie } from '@/lib/auth';
import { EmptyResult, createError, emptyFailureWithErrors, emptySuccess, isSuccess } from '@/lib/result';
import { SignInSchema } from '@/lib/schemas';
import { AuthService } from '@/lib/services';
import { mapZodErrorsToErrorDto } from '@/lib/zod.utils';

const AUTH = CODES.AUTH.USERS;

const authService = new AuthService();

/**
 * Sign in with an email and password.
 *
 * The service decides whether the credentials are good and why not; this action only
 * validates the shape, then turns a successful verification into a session cookie.
 *
 * @param values - Raw form values, validated here rather than trusted.
 *
 * @returns Empty result — success, or a failure carrying the reason's code.
 */
export async function signInAction(values: unknown): Promise<EmptyResult> {
  const validation = SignInSchema.safeParse(values);

  if (!validation.success) {
    return emptyFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  const result = await authService.verifyCredentials(validation.data.email, validation.data.password);

  if (!isSuccess(result) || !result.result) {
    const errors = result.errors.length > 0 ? result.errors : [createError(AUTH.SIGN_IN_FAILED.CODE, AUTH.SIGN_IN_FAILED.MESSAGE)];

    return emptyFailureWithErrors(errors);
  }

  const user = result.result;

  await setSessionCookie({
    userId: user.userId,
    email: user.email,
    name: user.name,
    role: user.role,
    isApproved: user.isApproved,
  });

  return emptySuccess();
}

/**
 * Sign out and return to the landing page in the current language.
 */
export async function signOutAction(): Promise<void> {
  await clearSessionCookie();

  const locale = await getLocale();

  redirect({ href: ROUTES.HOME.HREF, locale });
}
