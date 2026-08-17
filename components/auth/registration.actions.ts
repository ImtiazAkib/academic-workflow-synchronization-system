'use server';

import { headers } from 'next/headers';

import { z } from 'zod';

import { env } from '@/env/server';

import { CODES } from '@/constants/codes.const';
import { RATE_LIMIT } from '@/constants/rate-limit.const';
import { ROUTES } from '@/constants/routes.const';

import { mail, buildLoginIdMail, buildPasswordResetMail, buildVerifyAddressMail } from '@/lib/mail';
import { EmptyResult, createError, emptyFailureWithError, emptySuccess, isSuccess, singleFailureWithErrors, singleSuccess } from '@/lib/result';
import type { SingleResult } from '@/lib/result';
import { PasswordResetSchema, StudentRegistrationSchema, TeacherRegistrationSchema, VerificationTokenSchema } from '@/lib/schemas';
import { AuthService, consumeRateLimit } from '@/lib/services';
import type { RateLimitBudget } from '@/lib/services';
import type { Registration } from '@/lib/services';
import { mapZodErrorsToErrorDto, resolveCallerKey } from '@/lib/utils';

const DATABASE = CODES.DATABASE.USERS;
const VALIDATION = CODES.VALIDATION.USERS;
const BUSINESS_COMMON = CODES.BUSINESS.COMMON;

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
 * header - a `Host` a caller controls is how a verification link ends up pointing at
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
 * Refuse a caller who has used up a budget, or let them through.
 *
 * Keyed on the caller rather than on what they submitted, because the abuse these two
 * endpoints enable is volume from one source rather than repetition of one value: email
 * uniqueness already bounds registering the same address twice, and the resend has a
 * per-account cooldown. Neither says anything about ten thousand different addresses.
 *
 * How much a caller key can be trusted depends on the deployment - see `resolveCallerKey`.
 *
 * @param scope - Which budget to count against.
 * @param budget - How many attempts, and over how long.
 *
 * @returns The refusal to return, or null when the request may proceed.
 */
async function refuseFloodedCaller(scope: string, budget: RateLimitBudget): Promise<EmptyResult | null> {
  const requestHeaders = await headers();

  if (await consumeRateLimit(scope, resolveCallerKey(requestHeaders, env.TRUSTED_PROXY), budget)) {
    return null;
  }

  return emptyFailureWithError(createError(BUSINESS_COMMON.TOO_MANY_REQUESTS.CODE, BUSINESS_COMMON.TOO_MANY_REQUESTS.MESSAGE));
}

/**
 * Turn a service refusal into the action's own result shape.
 *
 * The fallback used to be `singleFailureWithErrors([]).errors[0]`, which reads as a way
 * to conjure an error and is in fact a throw: that constructor refuses an empty list. So
 * the branch written to handle "a failure that carries no reason" was the one branch that
 * could not return a Result at all. Unreachable today, because every `AuthService` failure
 * supplies an error - but a throw on the failure path of a Result-returning function is
 * the kind of thing that stays unreachable right up until it is not.
 *
 * @param result - The failed registration.
 *
 * @returns The refusal, carrying every reason.
 */
function refusal(result: SingleResult<Registration>): EmptyResult {
  const [first] = result.errors;

  return emptyFailureWithError(first ?? createError(DATABASE.CREATE_FAILED.CODE, DATABASE.CREATE_FAILED.MESSAGE));
}

/**
 * Register a student.
 *
 * @param values - Raw form values, validated here rather than trusted.
 *
 * @returns Empty success, or a failure carrying the reason's code.
 */
export async function registerStudentAction(values: unknown): Promise<EmptyResult> {
  const refused = await refuseFloodedCaller('register', RATE_LIMIT.REGISTER);

  if (refused) {
    return refused;
  }

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
  const refused = await refuseFloodedCaller('register', RATE_LIMIT.REGISTER);

  if (refused) {
    return refused;
  }

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
 * logic because it writes - issuing an identifier is a mutation, and a page that mutated
 * on GET would fire again on every refresh and every link prefetch.
 *
 * @param token - Raw token from the link.
 *
 * @returns The issued identifier, or a failure carrying the reason's code.
 */
export async function verifyEmailAction(token: unknown): Promise<SingleResult<string>> {
  const validation = VerificationTokenSchema.safeParse(token);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  const result = await authService.verifyEmail(validation.data);

  if (!isSuccess(result) || !result.result) {
    return singleFailureWithErrors(result.errors);
  }

  const { user, loginId } = result.result;

  await mail.send(buildLoginIdMail(user.email, user.name, loginId, new URL(ROUTES.SIGN_IN.HREF, env.APP_BASE_URL).toString()));

  return singleSuccess(loginId);
}

/**
 * Confirm an address change, and report which address the account now holds.
 *
 * Sits beside `verifyEmailAction` rather than with the profile screen that started the
 * change, because the caller is the same kind of caller: somebody arriving from an inbox
 * with a token and no session. It takes none and needs none - the token is the proof.
 *
 * Nothing is emailed afterwards. Registration mails the identifier because that is the
 * only way it is ever delivered; here the account already has everything it needs, and a
 * message to the new address would only repeat what the screen just said.
 *
 * @param token - Raw token from the link.
 *
 * @returns The confirmed address, or a failure carrying the reason's code.
 */
export async function confirmEmailChangeAction(token: unknown): Promise<SingleResult<string>> {
  const validation = VerificationTokenSchema.safeParse(token);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  const result = await authService.confirmEmailChange(validation.data);

  if (!isSuccess(result) || !result.result) {
    return singleFailureWithErrors(result.errors);
  }

  return singleSuccess(result.result.email);
}

/**
 * Send a fresh confirmation link to an address that has not confirmed one.
 *
 * Names an unregistered address rather than hiding it: the department asked for an explicit
 * "no account here" over the silent "check your inbox", so an unknown address is a failure
 * carrying `EMAIL_NOT_REGISTERED`. That is a deliberate reversal of the anti-enumeration
 * stance sign-in keeps, and the trade - this screen can now be used to probe which
 * addresses exist - was accepted for it. Every registered case still looks identical: an
 * account that is already confirmed, switched off, or inside its cooldown gets the same
 * "check your inbox", with no email sent and no state disclosed.
 *
 * Throttled in two dimensions, because one endpoint can be abused two ways. The account
 * cooldown lives in `AuthService.reissueVerification` and stops one address being mailed
 * over and over; the caller budget here stops one script walking many addresses, each of
 * which is individually within its cooldown. A throttled caller is told so, the same as
 * sign-in, rather than shown a false "sent".
 *
 * @param email - Address as typed.
 *
 * @returns Empty success when a link went out or the registered account had nothing to
 *   send; a failure naming an unregistered address, a malformed one, or a throttled caller.
 */
export async function resendVerificationAction(email: unknown): Promise<EmptyResult> {
  if (await refuseFloodedCaller('resend', RATE_LIMIT.RESEND)) {
    return emptyFailureWithError(createError(BUSINESS_COMMON.TOO_MANY_REQUESTS.CODE, BUSINESS_COMMON.TOO_MANY_REQUESTS.MESSAGE));
  }

  const parsed = z.string().trim().toLowerCase().safeParse(email);

  if (!parsed.success) {
    return emptyFailureWithError(createError(VALIDATION.EMAIL_INVALID.CODE, VALIDATION.EMAIL_INVALID.MESSAGE, 'email'));
  }

  const result = await authService.reissueVerification(parsed.data);

  if (!isSuccess(result)) {
    return emptyFailureWithError(
      result.errors[0] ?? createError(VALIDATION.EMAIL_NOT_REGISTERED.CODE, VALIDATION.EMAIL_NOT_REGISTERED.MESSAGE, 'email')
    );
  }

  // A null payload is a registered account with nothing to send - reported as success.
  if (result.result) {
    await mail.send(buildVerifyAddressMail(result.result.user.email, result.result.user.name, buildVerifyUrl(result.result.verificationToken)));
  }

  return emptySuccess();
}

/**
 * Build the absolute link that carries a password-reset token.
 *
 * Absolute and from `APP_BASE_URL` rather than a request header, the same reason
 * `buildVerifyUrl` is: a `Host` the caller controls is how a link ends up pointing at
 * somebody else's server.
 *
 * @param token - Raw reset token.
 *
 * @returns The URL to put in the message.
 */
function buildResetUrl(token: string): string {
  const url = new URL(ROUTES.RESET_PASSWORD.HREF, env.APP_BASE_URL);

  url.searchParams.set('token', token);

  return url.toString();
}

/**
 * The request half of forgot-password: mail a reset link to an account that can use one.
 *
 * Shaped exactly like `resendVerificationAction`, including the deliberate reversal - an
 * unregistered address is named rather than hidden, because the department asked for the
 * explicit answer here too. A registered-but-unusable account (unverified, deactivated, or
 * inside the cooldown) is a silent success with nothing sent.
 *
 * @param email - Address as typed.
 *
 * @returns Empty success when a link went out or there was nothing to send; a failure
 *   naming an unregistered or malformed address, or a throttled caller.
 */
export async function requestPasswordResetAction(email: unknown): Promise<EmptyResult> {
  if (await refuseFloodedCaller('password-reset', RATE_LIMIT.PASSWORD_RESET)) {
    return emptyFailureWithError(createError(BUSINESS_COMMON.TOO_MANY_REQUESTS.CODE, BUSINESS_COMMON.TOO_MANY_REQUESTS.MESSAGE));
  }

  const parsed = z.string().trim().toLowerCase().safeParse(email);

  if (!parsed.success) {
    return emptyFailureWithError(createError(VALIDATION.EMAIL_INVALID.CODE, VALIDATION.EMAIL_INVALID.MESSAGE, 'email'));
  }

  const result = await authService.issuePasswordReset(parsed.data);

  if (!isSuccess(result)) {
    return emptyFailureWithError(
      result.errors[0] ?? createError(VALIDATION.EMAIL_NOT_REGISTERED.CODE, VALIDATION.EMAIL_NOT_REGISTERED.MESSAGE, 'email')
    );
  }

  if (result.result) {
    await mail.send(buildPasswordResetMail(result.result.user.email, result.result.user.name, buildResetUrl(result.result.resetToken)));
  }

  return emptySuccess();
}

/**
 * The apply half of forgot-password: set a new password from a link.
 *
 * A form action rather than the auto-firing effect the email-verification screen uses,
 * because the token is spent by the write - it must be spent on submit, not on the page
 * loading, so a refresh or a link prefetch cannot burn it before the new password is typed.
 *
 * @param values - Raw form values - the token and the two password boxes.
 *
 * @returns Empty success, or a failure carrying the reason's code.
 */
export async function resetPasswordAction(values: unknown): Promise<EmptyResult> {
  const validation = PasswordResetSchema.safeParse(values);

  if (!validation.success) {
    return emptyFailureWithError(mapZodErrorsToErrorDto(validation.error)[0]);
  }

  const result = await authService.resetPassword(validation.data.token, validation.data.password);

  if (!isSuccess(result) || !result.result) {
    return emptyFailureWithError(result.errors[0] ?? createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
  }

  return emptySuccess();
}
