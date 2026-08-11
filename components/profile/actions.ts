'use server';

import { env } from '@/env/server';
import { UserDto } from '@/types';

import { CODES } from '@/constants/codes.const';
import { ROUTES } from '@/constants/routes.const';

import { getSessionUser, setSessionCookie } from '@/lib/auth';
import { buildVerifyNewAddressMail, mail } from '@/lib/mail';
import {
  EmptyResult,
  SingleResult,
  createError,
  emptyFailureWithError,
  emptyFailureWithErrors,
  isSuccess,
  singleFailure,
  singleFailureWithErrors,
  singleSuccess,
} from '@/lib/result';
import { ChangePasswordSchema, ProfileUpdateSchema } from '@/lib/schemas';
import { UserService } from '@/lib/services';
import { mapZodErrorsToErrorDto } from '@/lib/utils';

const AUTH = CODES.AUTH.COMMON;

const userService = new UserService();

/**
 * Build the absolute link that carries the email-change token.
 *
 * Absolute because it goes in an email, and from `APP_BASE_URL` rather than a request
 * header, for the same reason registration does it: a `Host` the caller controls is how
 * a confirmation link ends up pointing at somebody else's server.
 *
 * @param token - Raw email-change token.
 *
 * @returns The URL to put in the message.
 */
function buildConfirmUrl(token: string): string {
  const url = new URL(ROUTES.VERIFY_EMAIL_CHANGE.HREF, env.APP_BASE_URL);

  url.searchParams.set('token', token);

  return url.toString();
}

/**
 * Save the fields an account holder owns about themselves.
 *
 * There is no gate helper for this the way there is for the admin area, because there is
 * nothing to authorize: any signed-in account may edit its own profile, and the profile
 * it edits is the one the session names. The session is still re-read here rather than
 * trusted from the page — a Server Action is a public endpoint, and the screen that
 * rendered the form proves nothing about who is posting to it.
 *
 * The session cookie is re-issued on success. It carries the name, which the topbar
 * greets somebody by; without this, changing your name leaves the old one on screen until
 * you next sign in, which reads as the save having silently failed. The address in the
 * cookie is taken from the saved record rather than the form, so an email change — which
 * has not happened yet — cannot slip into the session ahead of being proven.
 *
 * @param values - Raw form values, validated here rather than trusted.
 *
 * @returns The saved account, or a failure carrying the reason's code.
 */
export async function updateProfileAction(values: unknown): Promise<SingleResult<UserDto>> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return singleFailure(createError(AUTH.NOT_AUTHENTICATED.CODE, AUTH.NOT_AUTHENTICATED.MESSAGE));
  }

  const validation = ProfileUpdateSchema.safeParse(values);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  const result = await userService.updateOwnProfile(validation.data, sessionUser);

  if (!isSuccess(result) || !result.result) {
    return singleFailureWithErrors(result.errors);
  }

  const { user, pendingEmailToken } = result.result;

  await setSessionCookie({
    userId: user.userId,
    email: user.email,
    name: user.name,
    role: user.role,
    isApproved: user.isApproved,
  });

  /*
    Sent after the write rather than before it. A message about a change that then failed
    to save is worse than a save with no message: the link would work, and would move the
    account onto an address nobody had asked for on this attempt.

    A failed send does not undo the save. The pending address is stored and its token is
    valid, so the remedy is to submit the form again — which mints a fresh token and
    retires this one — rather than losing the name and phone number that saved fine.
  */
  if (pendingEmailToken && user.pendingEmail) {
    await mail.send(buildVerifyNewAddressMail(user.pendingEmail, user.name, buildConfirmUrl(pendingEmailToken)));
  }

  return singleSuccess(user);
}

/**
 * Change the password on the caller's own account.
 *
 * Any signed-in account may change its own password, so — like `updateProfileAction` —
 * there is nothing to authorize beyond having a session, and the session is re-read here
 * rather than trusted from the page. The current password is verified against the stored
 * hash inside the service; this action only proves who is asking and hands the values on.
 *
 * Nothing is re-issued or mailed. The session cookie carries a name and a role, neither of
 * which a password change touches, so the cookie stays valid and no new one is minted.
 *
 * @param values - Raw form values, validated here rather than trusted.
 *
 * @returns Empty success, or a failure carrying the reason's code.
 */
export async function changePasswordAction(values: unknown): Promise<EmptyResult> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return emptyFailureWithError(createError(AUTH.NOT_AUTHENTICATED.CODE, AUTH.NOT_AUTHENTICATED.MESSAGE));
  }

  const validation = ChangePasswordSchema.safeParse(values);

  if (!validation.success) {
    return emptyFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  return userService.changeOwnPassword(validation.data, sessionUser);
}
