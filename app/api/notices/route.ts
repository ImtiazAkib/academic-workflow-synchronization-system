import { NextResponse, type NextRequest } from 'next/server';

import { RATE_LIMIT } from '@/constants/rate-limit.const';

import { withForbidden, withOk, withTooManyRequests, withUnauthorized } from '@/lib/api';
import { gateAdminArea, getSessionUser } from '@/lib/auth';
import { isSuccess } from '@/lib/result';
import { NoticeCreateSchema } from '@/lib/schemas';
import { NoticeService, consumeRateLimit } from '@/lib/services';
import { mapZodErrorsToErrorDto } from '@/lib/utils';

import type { NoticeDto } from '@/types';

const noticeService = new NoticeService();

/*
  A route handler rather than a Server Action, for the reason the materials upload gives:
  an action serializes its arguments, and a file has no business going through that.
  `FormData` streams.

  Publishing moved here wholesale rather than splitting into "create the notice, then
  attach the image". A notice is text, a picture, or both — one request either publishes
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
  */
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return withUnauthorized();
  }

  const gate = await gateAdminArea<NoticeDto>();

  if (!gate.allowed) {
    return withForbidden();
  }

  // Before `formData()`, so a refusal costs nothing — see the materials upload.
  if (!(await consumeRateLimit('upload', sessionUser.userId, RATE_LIMIT.UPLOAD))) {
    return withTooManyRequests();
  }

  const form = await request.formData();

  /*
    An untouched file picker submits a zero-byte file rather than nothing at all, so it is
    turned back into an absence here — the schema's `image` is optional, and "absent" has to mean
    absent or a text-only notice would be refused for carrying an empty picture.
  */
  const submitted = form.get('image');
  const image = submitted instanceof File && submitted.size > 0 ? submitted : undefined;

  const validation = NoticeCreateSchema.safeParse({
    title: form.get('title'),
    body: form.get('body') ?? undefined,
    image,
    audience: form.get('audience'),
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

  const result = await noticeService.create(validation.data, gate.requester);

  if (!isSuccess(result)) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return withOk(result.result);
}
