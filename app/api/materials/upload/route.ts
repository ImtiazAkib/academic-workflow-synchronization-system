import { NextResponse, type NextRequest } from 'next/server';

import { RATE_LIMIT } from '@/constants/rate-limit.const';
import { USER_ROLES } from '@/constants/roles.const';

import { withForbidden, withInsufficientStorage, withOk, withTooManyRequests, withUnauthorized } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import { isSuccess } from '@/lib/result';
import { MaterialUploadSchema } from '@/lib/schemas';
import { MaterialService, consumeRateLimit, getStorageStatus } from '@/lib/services';
import { mapZodErrorsToErrorDto } from '@/lib/utils';

const materialService = new MaterialService();

/*
  A route handler rather than a Server Action, because an action serializes its
  arguments and a 25 MB file has no business going through that. `FormData` streams.

  Everything the request claims - course, title, type, size - is validated here and
  again in the service. The only thing trusted is the session cookie.
*/
export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return withUnauthorized();
  }

  // Students read materials; they do not publish them.
  if (sessionUser.role === USER_ROLES.STUDENT) {
    return withForbidden();
  }

  /*
    Before `formData()`, and the order is the whole point. Refusing after the body is read
    means the bytes already crossed the wire and sat in a buffer - which is most of what
    the limit exists to prevent. Keyed on the account rather than the caller, because this
    endpoint requires a session: a user id is a fact the server issued, where a forwarded
    address is a header somebody may be able to set.

    The bucket these files land in is the same database that holds users, courses and the
    timetable, so filling it does not degrade materials - it takes down every feature at
    once.
  */
  if (!(await consumeRateLimit('upload', sessionUser.userId, RATE_LIMIT.UPLOAD))) {
    return withTooManyRequests();
  }

  /*
    Before `formData()`, alongside the rate-limit gate and for the same reason: refusing
    after the body is read means a file the bucket cannot hold has already crossed the wire.
    A material always carries a file, so a full bucket turns the whole request away here -
    the exact "does this particular file fit" check still runs in the service.
  */
  if ((await getStorageStatus()).full) {
    return withInsufficientStorage();
  }

  const form = await request.formData();

  const validation = MaterialUploadSchema.safeParse({
    courseId: form.get('courseId'),
    title: form.get('title'),
    description: form.get('description') ?? undefined,
    file: form.get('file'),
  });

  if (!validation.success) {
    return NextResponse.json({ errors: mapZodErrorsToErrorDto(validation.error) }, { status: 400 });
  }

  const result = await materialService.upload(validation.data, sessionUser);

  if (!isSuccess(result)) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return withOk(result.result);
}
