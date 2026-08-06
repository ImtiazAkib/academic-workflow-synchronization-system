'use server';

import { CourseDto } from '@/types';

import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';

import { getSessionUser } from '@/lib/auth';
import { SingleResult, createError, singleFailure, singleFailureWithErrors } from '@/lib/result';
import { CourseCreateSchema, CourseUpdateSchema, objectIdField } from '@/lib/schemas';
import { CourseService } from '@/lib/services';
import { mapZodErrorsToErrorDto } from '@/lib/utils';

const AUTH = CODES.AUTH.COMMON;

const courseService = new CourseService();

/*
  Every action re-checks the session itself — a Server Action is a public endpoint, and
  the page guard that hid the button proves nothing about who is calling it. It returns
  a Result rather than redirecting, because `getLocale()` reads `next/root-params`,
  which is unavailable inside a Server Action.
*/
async function refuseNonAdministrator(): Promise<SingleResult<CourseDto> | null> {
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
 * Create a course.
 *
 * @param values - Raw form values, validated here rather than trusted.
 *
 * @returns The created course, or a failure carrying field-level reasons.
 */
export async function createCourseAction(values: unknown): Promise<SingleResult<CourseDto>> {
  const refusal = await refuseNonAdministrator();

  if (refusal) {
    return refusal;
  }

  const validation = CourseCreateSchema.safeParse(values);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  return courseService.create(validation.data);
}

/**
 * Edit a course.
 *
 * @param values - Raw form values, validated here rather than trusted.
 *
 * @returns The updated course, or a failure.
 */
export async function updateCourseAction(values: unknown): Promise<SingleResult<CourseDto>> {
  const refusal = await refuseNonAdministrator();

  if (refusal) {
    return refusal;
  }

  const validation = CourseUpdateSchema.safeParse(values);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  return courseService.update(validation.data);
}

/**
 * Switch a course on or off — the boolean decides which.
 *
 * @param courseId - Course to change.
 * @param isActive - The new state.
 *
 * @returns The updated course, or a failure.
 */
export async function setCourseActiveAction(courseId: unknown, isActive: boolean): Promise<SingleResult<CourseDto>> {
  const refusal = await refuseNonAdministrator();

  if (refusal) {
    return refusal;
  }

  const validation = objectIdField.safeParse(courseId);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  return courseService.setActive(validation.data, isActive);
}
