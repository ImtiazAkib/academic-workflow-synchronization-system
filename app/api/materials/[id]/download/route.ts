import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/auth';
import { isSuccess } from '@/lib/result';
import { MaterialService } from '@/lib/services';

const materialService = new MaterialService();

/*
  Sanitized because it goes into a response header. A file name carrying a quote or a
  CRLF would otherwise break out of the header and let the uploader write headers of
  their own — the name is attacker-controlled, since they chose it when uploading.
*/
function toHeaderFileName(fileName: string): string {
  return fileName.replace(/[\r\n"\\]/g, '_');
}

/**
 * Stream a material to someone allowed to have it.
 *
 * The id in the URL is the material's, never the storage key: resolving one to the
 * other happens in the service, behind the access check, so the bucket cannot be read
 * by guessing.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const sessionUser = await getSessionUser();
  const result = await materialService.openForDownload(id, sessionUser);

  if (!isSuccess(result) || !result.result) {
    return NextResponse.json({ errors: result.errors }, { status: sessionUser ? 404 : 401 });
  }

  const file = result.result;

  /*
    These three headers are the difference between serving a file and running one.

    An uploaded file is attacker-controlled content served from the app's own origin.
    Rendered inline, a crafted document executes with access to the session cookie and
    can call Server Actions as whoever opened it — so a bad upload becomes a stolen
    admin account without any malware involved.

    `attachment` makes the browser download rather than render. `nosniff` stops it
    second-guessing the declared type and rendering anyway. `sandbox` neuters scripts in
    anything that does end up rendered, such as a PDF opened by the built-in viewer.
  */
  return new NextResponse(file.stream, {
    status: 200,
    headers: {
      'Content-Type': file.mimeType,
      'Content-Length': String(file.size),
      'Content-Disposition': `attachment; filename="${toHeaderFileName(file.fileName)}"`,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': 'sandbox',
      // Private: a signed-in response must not sit in a shared cache.
      'Cache-Control': 'private, no-store',
    },
  });
}
