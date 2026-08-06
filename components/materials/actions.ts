'use server';

import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';

import { getSessionUser } from '@/lib/auth';
import { EmptyResult, createError, emptyFailureWithError } from '@/lib/result';
import { MaterialService } from '@/lib/services';

const AUTH = CODES.AUTH.COMMON;

const materialService = new MaterialService();

/**
 * Delete a material.
 *
 * Uploading goes through a route handler because a 25 MB file has no business being
 * serialized as a Server Action argument. Deleting is just an id, so it stays here.
 *
 * The service re-checks ownership — a teacher may only delete what they uploaded.
 *
 * @param materialId - Material to remove.
 *
 * @returns Empty success, or a failure.
 */
export async function deleteMaterialAction(materialId: string): Promise<EmptyResult> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return emptyFailureWithError(createError(AUTH.NOT_AUTHENTICATED.CODE, AUTH.NOT_AUTHENTICATED.MESSAGE));
  }

  if (sessionUser.role === USER_ROLES.STUDENT) {
    return emptyFailureWithError(createError(AUTH.NOT_AUTHORIZED.CODE, AUTH.NOT_AUTHORIZED.MESSAGE));
  }

  return materialService.remove(materialId, sessionUser);
}
