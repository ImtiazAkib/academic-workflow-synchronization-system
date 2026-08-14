import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/auth';
import { isSuccess } from '@/lib/result';
import { MaterialService } from '@/lib/services';

const materialService = new MaterialService();

/** Stream a material that can be previewed only after the same access check used for downloads. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  const result = await materialService.openForDownload(id, sessionUser);

  if (!isSuccess(result) || !result.result) {
    return NextResponse.json({ errors: result.errors }, { status: sessionUser ? 404 : 401 });
  }

  const file = result.result;
  return new NextResponse(file.stream, {
    headers: {
      'Content-Type': file.mimeType,
      'Content-Length': String(file.size),
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': 'sandbox',
      'Cache-Control': 'private, no-store',
    },
  });
}
