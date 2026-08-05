'use server';

import { UserDto } from '@/types';

import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';

import { getSessionUser } from '@/lib/auth';
import { SingleResult, createError, singleFailure, singleFailureWithErrors } from '@/lib/result';
import { UserActivateSchema, UserApproveSchema, UserCreateSchema, UserUpdateSchema } from '@/lib/schemas';
import { UserService } from '@/lib/services';
import { mapZodErrorsToErrorDto } from '@/lib/utils';

const AUTH = CODES.AUTH.COMMON;

const userService = new UserService();

/*
  Every action re-checks the session itself. A Server Action is a public endpoint — the
  page guard that hid the button proves nothing about who is calling it.

  It returns a Result rather than redirecting the way `requireRole` does: `getLocale()`
  reads `next/root-params`, which is unavailable inside a Server Action, and a refusal
  the dialog can render beats a redirect it cannot follow.
*/
async function refuseNonAdministrator(): Promise<SingleResult<UserDto> | null> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return singleFailure(createError(AUTH.NOT_AUTHENTICATED.CODE, AUTH.NOT_AUTHENTICATED.MESSAGE));
  }

  if (sessionUser.role !== USER_ROLES.ADMIN) {
    return singleFailure(createError(AUTH.NOT_AUTHORIZED.CODE, AUTH.NOT_AUTHORIZED.MESSAGE));
  }

  return null;
}

/**
 * Create an account.
 *
 * @param values - Raw form values, validated here rather than trusted.
 *
 * @returns The created account, or a failure carrying field-level reasons.
 */
export async function createUserAction(values: unknown): Promise<SingleResult<UserDto>> {
  const refusal = await refuseNonAdministrator();

  if (refusal) {
    return refusal;
  }

  const validation = UserCreateSchema.safeParse(values);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  return userService.create(validation.data);
}

/**
 * Edit a profile.
 *
 * @param values - Raw form values, validated here rather than trusted.
 *
 * @returns The updated account, or a failure.
 */
export async function updateUserAction(values: unknown): Promise<SingleResult<UserDto>> {
  const refusal = await refuseNonAdministrator();

  if (refusal) {
    return refusal;
  }

  const validation = UserUpdateSchema.safeParse(values);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  return userService.update(validation.data);
}

/**
 * Approve an account, or take approval back — the boolean decides which.
 *
 * @param values - Raw values carrying the account id and the new approval flag.
 *
 * @returns The updated account, or a failure.
 */
export async function approveUserAction(values: unknown): Promise<SingleResult<UserDto>> {
  const refusal = await refuseNonAdministrator();

  if (refusal) {
    return refusal;
  }

  const validation = UserApproveSchema.safeParse(values);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  return userService.setApproval(validation.data);
}

/**
 * Switch an account off, or back on — the boolean decides which.
 *
 * Accounts are never deleted, so schedules and materials keep a valid author.
 *
 * @param values - Raw values carrying the account id and the new active flag.
 *
 * @returns The updated account, or a failure.
 */
export async function deactivateUserAction(values: unknown): Promise<SingleResult<UserDto>> {
  const refusal = await refuseNonAdministrator();

  if (refusal) {
    return refusal;
  }

  const validation = UserActivateSchema.safeParse(values);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  return userService.setActive(validation.data);
}
