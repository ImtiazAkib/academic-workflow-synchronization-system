import { NextResponse, type NextRequest } from 'next/server';

import { z } from 'zod';

import { USER_ROLES } from '@/constants/roles.const';

import { withForbidden, withOk, withUnauthorized } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import { isSuccess } from '@/lib/result';
import { NoticeService } from '@/lib/services';

const noticeService = new NoticeService();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return withUnauthorized();
  if (sessionUser.role === USER_ROLES.STUDENT) return withForbidden();

  const { id } = await params;
  const form = await request.formData();
  const submitted = form.get('file');
  const file = submitted instanceof File && submitted.size > 0 ? submitted : undefined;
  const validation = z
    .object({
      title: z.string().trim().min(1).max(200),
      body: z.string().trim().max(5000).optional(),
      removeAttachment: z.boolean(),
    })
    .safeParse({
      title: form.get('title'),
      body: form.get('body') ?? undefined,
      removeAttachment: form.get('removeAttachment') === 'true',
    });
  if (!validation.success) return NextResponse.json({ errors: [{ code: 0, error: 'Invalid notice update.' }] }, { status: 400 });

  const result = await noticeService.update(id, { ...validation.data, file }, sessionUser);
  if (!isSuccess(result)) return NextResponse.json({ errors: result.errors }, { status: 400 });
  return withOk(result.result);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return withUnauthorized();
  if (sessionUser.role === USER_ROLES.STUDENT) return withForbidden();

  const { id } = await params;
  const result = await noticeService.delete(id, sessionUser);
  if (!isSuccess(result)) return NextResponse.json({ errors: result.errors }, { status: 400 });
  return withOk({});
}
