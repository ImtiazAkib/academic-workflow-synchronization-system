'use server';

import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';

import { getSessionUser } from '@/lib/auth';
import { EmptyResult, createError, emptyFailureWithError } from '@/lib/result';
import { objectIdField } from '@/lib/schemas';
import { MaterialService } from '@/lib/services';
import { mapZodErrorsToErrorDto } from '@/lib/utils';

const AUTH = CODES.AUTH.COMMON;

const materialService = new MaterialService();

/**
 * Delete a material.
 *
 * Uploading goes through a route handler because a 25 MB file has no business being
 * serialized as a Server Action argument. Deleting is just an id, so it stays here.
 *
 * The service re-checks ownership - a teacher may only delete what they uploaded.
 *
 * The id is parsed rather than trusted, and `unknown` rather than `string` is the point
 * of it. A TypeScript annotation is erased at runtime, so it stops nothing: a Server
 * Action is a public endpoint, and a hand-built request may send an object. `{ $ne: null }`
 * arriving here would cast into a Mongo query that matches every material and hand the
 * service somebody else's row to consider - the ownership check would still refuse it,
 * but the row it refused would have been chosen by the caller's operator rather than by
 * an id. Every other action in the app parses its input; this one was the exception.
 *
 * @param materialId - Material to remove, validated here rather than trusted.
 *
 * @returns Empty success, or a failure.
 */
export async function deleteMaterialAction(materialId: unknown): Promise<EmptyResult> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return emptyFailureWithError(createError(AUTH.NOT_AUTHENTICATED.CODE, AUTH.NOT_AUTHENTICATED.MESSAGE));
  }

  if (sessionUser.role === USER_ROLES.STUDENT) {
    return emptyFailureWithError(createError(AUTH.NOT_AUTHORIZED.CODE, AUTH.NOT_AUTHORIZED.MESSAGE));
  }

  const validation = objectIdField.safeParse(materialId);

  if (!validation.success) {
    return emptyFailureWithError(mapZodErrorsToErrorDto(validation.error)[0]);
  }

  return materialService.remove(validation.data, sessionUser);
}
