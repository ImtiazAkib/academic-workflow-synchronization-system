import { NextResponse, type NextRequest } from 'next/server';

import { USER_ROLES } from '@/constants/roles.const';

import { withForbidden, withOk, withUnauthorized } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import { isSuccess } from '@/lib/result';
import { MaterialUploadSchema } from '@/lib/schemas';
import { MaterialService } from '@/lib/services';
import { mapZodErrorsToErrorDto } from '@/lib/utils';

const materialService = new MaterialService();

/*
  A route handler rather than a Server Action, because an action serializes its
  arguments and a 25 MB file has no business going through that. `FormData` streams.

  Everything the request claims — course, title, type, size — is validated here and
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

  const form = await request.formData();

  const validation = MaterialUploadSchema.safeParse({
    courseId: form.get('courseId'),
    title: form.get('title'),
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
