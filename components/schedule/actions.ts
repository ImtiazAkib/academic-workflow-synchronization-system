'use server';

import { ClassSessionDto } from '@/types';

import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';

import { gateAdminArea, getSessionUser } from '@/lib/auth';
import { EmptyResult, SingleResult, createError, emptyFailureWithError, singleFailure, singleFailureWithErrors } from '@/lib/result';
import { ClassSessionCancelSchema, ClassSessionCreateSchema, ClassSessionUpdateSchema, objectIdField } from '@/lib/schemas';
import { ClassSessionService } from '@/lib/services';
import { mapZodErrorsToErrorDto } from '@/lib/utils';

const AUTH = CODES.AUTH.COMMON;

const classSessionService = new ClassSessionService();

/**
 * Put a class on the timetable.
 *
 * @param values - Raw form values, validated here rather than trusted.
 *
 * @returns The created session, or a failure naming every clash it hit.
 */
export async function createClassSessionAction(values: unknown): Promise<SingleResult<ClassSessionDto>> {
  const gate = await gateAdminArea<ClassSessionDto>();

  if (!gate.allowed) {
    return gate.refusal;
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
  /*
    Open to teachers as well as administrators, like the cancel action - a teacher moving
    their own class is what the teacher schedule offers. The whole session goes to the
    service, which enforces ownership and pins the course, teacher and semester so a teacher
    can only change the day and time. An admin-only gate here left that advertised feature
    dead, refusing every teacher submission.
  */
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return singleFailure(createError(AUTH.NOT_AUTHENTICATED.CODE, AUTH.NOT_AUTHENTICATED.MESSAGE));
  }

  if (sessionUser.role === USER_ROLES.STUDENT) {
    return singleFailure(createError(AUTH.NOT_AUTHORIZED.CODE, AUTH.NOT_AUTHORIZED.MESSAGE));
  }

  const validation = ClassSessionUpdateSchema.safeParse(values);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  return classSessionService.update(validation.data, sessionUser);
}

/**
 * Call a class off for the week, or put it back.
 *
 * Open to teachers as well as administrators - but a teacher's own id is passed to the
 * service, which refuses a class they are not teaching. The scope comes from the
 * session, never from the caller's arguments.
 *
 * @param values - Raw values carrying the session id and the new cancelled flag.
 *
 * @returns The updated session, or a failure.
 */
export async function setClassSessionCancelledAction(values: unknown): Promise<SingleResult<ClassSessionDto>> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return singleFailure(createError(AUTH.NOT_AUTHENTICATED.CODE, AUTH.NOT_AUTHENTICATED.MESSAGE));
  }

  if (sessionUser.role === USER_ROLES.STUDENT) {
    return singleFailure(createError(AUTH.NOT_AUTHORIZED.CODE, AUTH.NOT_AUTHORIZED.MESSAGE));
  }

  const validation = ClassSessionCancelSchema.safeParse(values);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  /*
    The whole session goes to the service, not a pre-computed scope. This used to pass
    `sessionUser.role === TEACHER ? userId : undefined`, and the service's check was
    `if (requestedBy && ...)` - so the rule was disabled by omitting an argument. A
    row-level rule that any caller can switch off by passing less is not a rule.
  */
  return classSessionService.setCancelled(validation.data.classSessionId, validation.data.isCancelled, sessionUser);
}

/**
 * Take a class off the timetable.
 *
 * @param classSessionId - Session to remove.
 *
 * @returns Empty success, or a failure.
 */
export async function deleteClassSessionAction(classSessionId: unknown): Promise<EmptyResult> {
  // Returns an `EmptyResult`, so the gate's refusal is unwrapped into one.
  const gate = await gateAdminArea<ClassSessionDto>();

  if (!gate.allowed) {
    return emptyFailureWithError(gate.refusal.errors[0]);
  }

  const validation = objectIdField.safeParse(classSessionId);

  if (!validation.success) {
    return emptyFailureWithError(mapZodErrorsToErrorDto(validation.error)[0]);
  }

  return classSessionService.remove(validation.data);
}
