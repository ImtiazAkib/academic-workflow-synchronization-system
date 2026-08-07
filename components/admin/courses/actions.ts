'use server';

import { CourseDto } from '@/types';

import { gateAdminArea } from '@/lib/auth';
import { SingleResult, singleFailureWithErrors } from '@/lib/result';
import { CourseCreateSchema, CourseUpdateSchema, objectIdField } from '@/lib/schemas';
import { CourseService } from '@/lib/services';
import { mapZodErrorsToErrorDto } from '@/lib/utils';

const courseService = new CourseService();

/**
 * Create a course.
 *
 * @param values - Raw form values, validated here rather than trusted.
 *
 * @returns The created course, or a failure carrying field-level reasons.
 */
export async function createCourseAction(values: unknown): Promise<SingleResult<CourseDto>> {
  const gate = await gateAdminArea<CourseDto>();

  if (!gate.allowed) {
    return gate.refusal;
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
  const gate = await gateAdminArea<CourseDto>();

  if (!gate.allowed) {
    return gate.refusal;
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
  const gate = await gateAdminArea<CourseDto>();

  if (!gate.allowed) {
    return gate.refusal;
  }

  const validation = objectIdField.safeParse(courseId);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  return courseService.setActive(validation.data, isActive);
}
