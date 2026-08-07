'use server';

import { UserDto } from '@/types';

import { gateAdminArea } from '@/lib/auth';
import { SingleResult, singleFailureWithErrors } from '@/lib/result';
import { UserActivateSchema, UserApproveSchema, UserCreateSchema, UserUpdateSchema } from '@/lib/schemas';
import { UserService } from '@/lib/services';
import { mapZodErrorsToErrorDto } from '@/lib/utils';

const userService = new UserService();

/**
 * Create an account.
 *
 * @param values - Raw form values, validated here rather than trusted.
 *
 * @returns The created account, or a failure carrying field-level reasons.
 */
export async function createUserAction(values: unknown): Promise<SingleResult<UserDto>> {
  const gate = await gateAdminArea<UserDto>();

  if (!gate.allowed) {
    return gate.refusal;
  }

  const validation = UserCreateSchema.safeParse(values);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  return userService.create(validation.data, gate.requester);
}

/**
 * Edit a profile.
 *
 * @param values - Raw form values, validated here rather than trusted.
 *
 * @returns The updated account, or a failure.
 */
export async function updateUserAction(values: unknown): Promise<SingleResult<UserDto>> {
  const gate = await gateAdminArea<UserDto>();

  if (!gate.allowed) {
    return gate.refusal;
  }

  const validation = UserUpdateSchema.safeParse(values);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  return userService.update(validation.data, gate.requester);
}

/**
 * Approve an account, or take approval back — the boolean decides which.
 *
 * @param values - Raw values carrying the account id and the new approval flag.
 *
 * @returns The updated account, or a failure.
 */
export async function approveUserAction(values: unknown): Promise<SingleResult<UserDto>> {
  const gate = await gateAdminArea<UserDto>();

  if (!gate.allowed) {
    return gate.refusal;
  }

  const validation = UserApproveSchema.safeParse(values);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  return userService.setApproval(validation.data, gate.requester);
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
  const gate = await gateAdminArea<UserDto>();

  if (!gate.allowed) {
    return gate.refusal;
  }

  const validation = UserActivateSchema.safeParse(values);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  return userService.setActive(validation.data, gate.requester);
}
