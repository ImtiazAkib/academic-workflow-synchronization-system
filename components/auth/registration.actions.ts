'use server';

import { env } from '@/env/server';

import { ROUTES } from '@/constants/routes.const';

import { mail, buildLoginIdMail, buildVerifyAddressMail } from '@/lib/mail';
import { EmptyResult, emptyFailureWithError, emptySuccess, isSuccess, singleFailureWithErrors } from '@/lib/result';
import type { SingleResult } from '@/lib/result';
import { StudentRegistrationSchema, TeacherRegistrationSchema } from '@/lib/schemas';
import { AuthService } from '@/lib/services';
import type { Registration } from '@/lib/services';
import { mapZodErrorsToErrorDto } from '@/lib/utils';

const authService = new AuthService();

/*
  Registration is the application's only unauthenticated write, so what is *absent* here
  is the security story. Neither action takes a role: the role is decided by which
  function was called, and never read from the payload. There is no field a hand-built
  request could set to `admin`, because the schema has none and this file supplies it.
*/

/**
 * Build the absolute link that carries the verification token.
 *
 * Absolute because it goes in an email, and from `APP_BASE_URL` rather than a request
 * header — a `Host` a caller controls is how a verification link ends up pointing at
 * somebody else's server.
 *
 * @param token - Raw verification token.
 *
 * @returns The URL to put in the message.
 */
function buildVerifyUrl(token: string): string {
  const url = new URL(ROUTES.VERIFY_EMAIL.HREF, env.APP_BASE_URL);

  url.searchParams.set('token', token);

  return url.toString();
}

/**
 * Send the confirmation link for a freshly registered account.
 *
 * A failed send is reported but does not undo the registration: the row is written and
 * the token is valid, so the remedy is a resend rather than losing the account. The
 * development driver writes the link to the log, which is what lets the whole flow be
 * walked with no mail server at all.
 *
 * @param registration - The new account and its token.
 *
 * @returns Empty success, or the failure to show.
 */
async function sendVerification(registration: Registration): Promise<EmptyResult> {
  await mail.send(buildVerifyAddressMail(registration.user.email, registration.user.name, buildVerifyUrl(registration.verificationToken)));

  return emptySuccess();
}

/**
 * Turn a service refusal into the action's own result shape.
 *
 * @param result - The failed registration.
 *
 * @returns The refusal, carrying every reason.
 */
function refusal(result: SingleResult<Registration>): EmptyResult {
  const [first] = result.errors;

  return first ? emptyFailureWithError(first) : emptyFailureWithError(singleFailureWithErrors([]).errors[0]);
}

/**
 * Register a student.
 *
 * @param values - Raw form values, validated here rather than trusted.
 *
 * @returns Empty success, or a failure carrying the reason's code.
 */
export async function registerStudentAction(values: unknown): Promise<EmptyResult> {
  const validation = StudentRegistrationSchema.safeParse(values);

  if (!validation.success) {
    return emptyFailureWithError(mapZodErrorsToErrorDto(validation.error)[0]);
  }

  const result = await authService.registerStudent(validation.data);

  if (!isSuccess(result) || !result.result) {
    return refusal(result);
  }

  return sendVerification(result.result);
}

/**
 * Register a teacher.
 *
 * @param values - Raw form values, validated here rather than trusted.
 *
 * @returns Empty success, or a failure carrying the reason's code.
 */
export async function registerTeacherAction(values: unknown): Promise<EmptyResult> {
  const validation = TeacherRegistrationSchema.safeParse(values);

  if (!validation.success) {
    return emptyFailureWithError(mapZodErrorsToErrorDto(validation.error)[0]);
  }

  const result = await authService.registerTeacher(validation.data);

  if (!isSuccess(result) || !result.result) {
    return refusal(result);
  }

  return sendVerification(result.result);
}

/**
 * Confirm an address and deliver the identifier it earns.
 *
 * Called from the verification page rather than a form: the visitor arrives by clicking
 * a link, so there is nothing to submit. It is still an action rather than page-render
 * logic because it writes — issuing an identifier is a mutation, and a page that mutated
 * on GET would fire again on every refresh and every link prefetch.
 *
 * @param token - Raw token from the link.
 *
 * @returns The issued identifier, or a failure carrying the reason's code.
 */
export async function verifyEmailAction(token: unknown): Promise<SingleResult<string>> {
  const result = await authService.verifyEmail(typeof token === 'string' ? token : '');

  if (!isSuccess(result) || !result.result) {
    return { success: false, result: null, errors: result.errors, messages: [] };
  }

  const { user, loginId } = result.result;

  await mail.send(buildLoginIdMail(user.email, user.name, loginId, new URL(ROUTES.SIGN_IN.HREF, env.APP_BASE_URL).toString()));

  return { success: true, result: loginId, errors: [], messages: [] };
}
