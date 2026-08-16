import { NextResponse, type NextRequest } from 'next/server';

import { CODES } from '@/constants/codes.const';
import { MATERIAL } from '@/constants/material.const';
import { RATE_LIMIT } from '@/constants/rate-limit.const';
import { USER_ROLES } from '@/constants/roles.const';

import { contentLengthExceeds, withForbidden, withOk, withPayloadTooLarge, withTooManyRequests, withUnauthorized } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import { isSuccess } from '@/lib/result';
import { MaterialUpdateSchema } from '@/lib/schemas';
import { MaterialService, consumeRateLimit } from '@/lib/services';
import { mapZodErrorsToErrorDto } from '@/lib/utils';

const materialService = new MaterialService();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return withUnauthorized();
  if (sessionUser.role === USER_ROLES.STUDENT) return withForbidden();

  /*
    Before formData(), like the upload route and for the same reason: replacing the file
    streams up to another 25 MB, and without this a teacher could loop PATCH on their own
    material and hammer the shared bucket, bypassing the upload throttle entirely. Only the
    per-account rate limit is shared with upload - not the "bucket full" short-circuit,
    because a text-only edit (title/description, no file) must still go through when full.
  */
  if (!(await consumeRateLimit('upload', sessionUser.userId, RATE_LIMIT.UPLOAD))) {
    return withTooManyRequests();
  }

  const { FILE_TOO_LARGE } = CODES.VALIDATION.MATERIALS;

  if (contentLengthExceeds(request, MATERIAL.MAX_SIZE_BYTES)) {
    return withPayloadTooLarge(FILE_TOO_LARGE.CODE, FILE_TOO_LARGE.MESSAGE);
  }

  const { id } = await params;
  const form = await request.formData();
  const submitted = form.get('file');
  const file = submitted instanceof File && submitted.size > 0 ? submitted : undefined;
  const validation = MaterialUpdateSchema.safeParse({
    materialId: id,
    courseId: form.get('courseId'),
    title: form.get('title'),
    description: form.get('description') ?? undefined,
    file,
  });

  if (!validation.success) return NextResponse.json({ errors: mapZodErrorsToErrorDto(validation.error) }, { status: 400 });
  const result = await materialService.update(validation.data, sessionUser);
  if (!isSuccess(result)) return NextResponse.json({ errors: result.errors }, { status: 400 });
  return withOk(result.result);
}
