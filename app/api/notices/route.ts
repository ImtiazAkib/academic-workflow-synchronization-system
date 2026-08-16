import { NextResponse, type NextRequest } from 'next/server';

import { CODES } from '@/constants/codes.const';
import { NOTICE_IMAGE } from '@/constants/notice.const';
import { RATE_LIMIT } from '@/constants/rate-limit.const';
import { USER_ROLES } from '@/constants/roles.const';

import { contentLengthExceeds, withForbidden, withOk, withPayloadTooLarge, withTooManyRequests, withUnauthorized } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import { isSuccess } from '@/lib/result';
import { NoticeCreateSchema } from '@/lib/schemas';
import { NoticeService, consumeRateLimit } from '@/lib/services';
import { mapZodErrorsToErrorDto } from '@/lib/utils';

const noticeService = new NoticeService();

/*
  A route handler rather than a Server Action, for the reason the materials upload gives:
  an action serializes its arguments, and a file has no business going through that.
  `FormData` streams.

  Publishing moved here wholesale rather than splitting into "create the notice, then
  attach the image". A notice is text, a picture, or both - one request either publishes
  all of it or none of it, where two would leave a picture-only notice half-created if the
  second call failed, with no body and no image and nothing to say.

  Everything the request claims is validated here and again in the service. The only thing
  trusted is the session cookie.
*/
export async function POST(request: NextRequest) {
  /*
    Signed out and wrong-role are told apart, matching the materials upload. Collapsing
    both into 403 tells somebody who simply is not signed in that they are forbidden,
    which sends them looking for a permission problem instead of a sign-in link.

    Teachers publish now too, not administrators alone - so the gate is "signed in and not
    a student" rather than the admin-area gate. What a teacher is allowed to publish (to
    students, general or session-specific) is the service's decision, checked against the
    session rather than the screen that hid the option.
  */
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return withUnauthorized();
  }

  if (sessionUser.role === USER_ROLES.STUDENT) {
    return withForbidden();
  }

  // Before `formData()`, so a refusal costs nothing - see the materials upload.
  if (!(await consumeRateLimit('upload', sessionUser.userId, RATE_LIMIT.UPLOAD))) {
    return withTooManyRequests();
  }

  // Also before formData(): the schema's size cap only runs once the body is buffered.
  const { IMAGE_TOO_LARGE } = CODES.VALIDATION.NOTICES;

  if (contentLengthExceeds(request, NOTICE_IMAGE.MAX_SIZE_BYTES)) {
    return withPayloadTooLarge(IMAGE_TOO_LARGE.CODE, IMAGE_TOO_LARGE.MESSAGE);
  }

  const form = await request.formData();

  /*
    An untouched file picker submits a zero-byte file rather than nothing at all, so it is
    turned back into an absence here - the schema's `image` is optional, and "absent" has to mean
    absent or a text-only notice would be refused for carrying an empty picture.
  */
  const submitted = form.get('image');
  const image = submitted instanceof File && submitted.size > 0 ? submitted : undefined;

  const validation = NoticeCreateSchema.safeParse({
    title: form.get('title'),
    body: form.get('body') ?? undefined,
    image,
    audience: form.get('audience'),
    category: form.get('category'),
    // One `sessions` entry per checkbox; a general notice sends none, and the schema defaults it to empty.
    sessions: form.getAll('sessions'),
  });

  /*
    Not `withBadRequest`, which returns `{ error: string }`. The publish form reads
    `errors[0].code` to pick its message, the same shape the materials upload returns, and
    a single sentence would cost it the ability to tell an oversized image from a missing
    body.
  */
  if (!validation.success) {
    return NextResponse.json({ errors: mapZodErrorsToErrorDto(validation.error) }, { status: 400 });
  }

  const result = await noticeService.create(validation.data, sessionUser);

  if (!isSuccess(result)) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return withOk(result.result);
}
