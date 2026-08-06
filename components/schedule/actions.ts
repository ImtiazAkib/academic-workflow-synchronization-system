'use server';

import { ClassSessionDto } from '@/types';

import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';

import { getSessionUser } from '@/lib/auth';
import { EmptyResult, SingleResult, createError, emptyFailureWithError, singleFailure, singleFailureWithErrors } from '@/lib/result';
import { ClassSessionCreateSchema, ClassSessionUpdateSchema, objectIdField } from '@/lib/schemas';
import { ClassSessionService } from '@/lib/services';
import { mapZodErrorsToErrorDto } from '@/lib/utils';

const AUTH = CODES.AUTH.COMMON;

const classSessionService = new ClassSessionService();

/*
  Every action re-checks the session itself — a Server Action is a public endpoint, and
  the page guard that hid the button proves nothing about who is calling it. It returns
  a Result rather than redirecting, because `getLocale()` reads `next/root-params`,
  which is unavailable inside a Server Action.
*/
async function refuseNonAdministrator(): Promise<SingleResult<ClassSessionDto> | null> {
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
 * Put a class on the timetable.
 *
 * @param values - Raw form values, validated here rather than trusted.
 *
 * @returns The created session, or a failure naming every clash it hit.
 */
export async function createClassSessionAction(values: unknown): Promise<SingleResult<ClassSessionDto>> {
  const refusal = await refuseNonAdministrator();

  if (refusal) {
    return refusal;
  }

  const validation = ClassSessionCreateSchema.safeParse(values);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  return classSessionService.create(validation.data);
}

/**
 * Move or re-point an existing class.
 *
 * @param values - Raw form values, validated here rather than trusted.
 *
 * @returns The updated session, or a failure naming every clash it hit.
 */
export async function updateClassSessionAction(values: unknown): Promise<SingleResult<ClassSessionDto>> {
  const refusal = await refuseNonAdministrator();

  if (refusal) {
    return refusal;
  }

  const validation = ClassSessionUpdateSchema.safeParse(values);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  return classSessionService.update(validation.data);
}

/**
 * Take a class off the timetable.
 *
 * @param classSessionId - Session to remove.
 *
 * @returns Empty success, or a failure.
 */
export async function deleteClassSessionAction(classSessionId: unknown): Promise<EmptyResult> {
  const refusal = await refuseNonAdministrator();

  if (refusal) {
    return emptyFailureWithError(refusal.errors[0]);
  }

  const validation = objectIdField.safeParse(classSessionId);

  if (!validation.success) {
    return emptyFailureWithError(mapZodErrorsToErrorDto(validation.error)[0]);
  }

  return classSessionService.remove(validation.data);
}
