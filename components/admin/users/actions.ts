'use server';

import { SessionUser, UserDto } from '@/types';

import { CODES } from '@/constants/codes.const';
import { ADMIN_AREA_ROLES } from '@/constants/roles.const';

import { getSessionUser } from '@/lib/auth';
import { SingleResult, createError, singleFailure, singleFailureWithErrors } from '@/lib/result';
import { UserActivateSchema, UserApproveSchema, UserCreateSchema, UserUpdateSchema } from '@/lib/schemas';
import { UserService } from '@/lib/services';
import { mapZodErrorsToErrorDto } from '@/lib/utils';

const AUTH = CODES.AUTH.COMMON;

const userService = new UserService();

/**
 * Either the account making the request, or the refusal to return instead.
 *
 * A discriminated union rather than a nullable pair, so a caller that forgets to check
 * cannot reach the requester — the type will not let it.
 */
type AdminAreaGate = { allowed: true; requester: SessionUser } | { allowed: false; refusal: SingleResult<UserDto> };

/*
  Every action re-checks the session itself. A Server Action is a public endpoint — the
  page guard that hid the button proves nothing about who is calling it.

  It returns a Result rather than redirecting the way `requireAdminArea` does:
  `getLocale()` reads `next/root-params`, which is unavailable inside a Server Action,
  and a refusal the dialog can render beats a redirect it cannot follow.

  The gate admits both administrators and the super administrator, and hands the caller
  back rather than merely approving them: which of the two is asking decides what they
  may do, and that decision belongs to `UserService`, not here. This layer answers "may
  you be in this area at all".
*/
async function gateAdminArea(): Promise<AdminAreaGate> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return { allowed: false, refusal: singleFailure(createError(AUTH.NOT_AUTHENTICATED.CODE, AUTH.NOT_AUTHENTICATED.MESSAGE)) };
  }

  if (!ADMIN_AREA_ROLES.some(role => role === sessionUser.role)) {
    return { allowed: false, refusal: singleFailure(createError(AUTH.NOT_AUTHORIZED.CODE, AUTH.NOT_AUTHORIZED.MESSAGE)) };
  }

  return { allowed: true, requester: sessionUser };
}

/**
 * Create an account.
 *
 * @param values - Raw form values, validated here rather than trusted.
 *
 * @returns The created account, or a failure carrying field-level reasons.
 */
export async function createUserAction(values: unknown): Promise<SingleResult<UserDto>> {
  const gate = await gateAdminArea();

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
  const gate = await gateAdminArea();

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
  const gate = await gateAdminArea();

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
  const gate = await gateAdminArea();

  if (!gate.allowed) {
    return gate.refusal;
  }

  const validation = UserActivateSchema.safeParse(values);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  return userService.setActive(validation.data, gate.requester);
}
