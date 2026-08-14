import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/auth';
import { isSuccess } from '@/lib/result';
import { NoticeService } from '@/lib/services';

const noticeService = new NoticeService();

/*
  Sanitized because it goes into a response header, exactly as the material download route
  does: a file name carrying a quote or a CRLF would otherwise break out of the header. The
  name is derived from the uploader's title, so it is attacker-influenced.
*/
function toHeaderFileName(fileName: string): string {
  return fileName.replace(/[\r\n"\\]/g, '_');
}

/**
 * Stream a notice's image to somebody the notice was addressed to.
 *
 * The audience rule is a filter everywhere else — a feed simply never lists a notice
 * outside the viewer's audience. Here it has to be an access check, because this URL
 * carries an id rather than being reached by a link: a student who guesses a notice id
 * would otherwise read a picture meant for the staff room.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const sessionUser = await getSessionUser();
  const result = await noticeService.openImage(id, sessionUser);

  if (!isSuccess(result) || !result.result) {
    return NextResponse.json({ errors: result.errors }, { status: sessionUser ? 404 : 401 });
  }

  const image = result.result;

  /*
    A raster image renders `inline`; a PDF - which notices now accept - is served
    `attachment` so the browser saves it rather than opening a document on this
    cookie-bearing origin, matching how a material is handed over. That is the reason for
    the type check: a raster format cannot carry script, but a PDF is a document that can,
    and `NOTICE_IMAGE_MIME_TYPES` was the three raster formats precisely so inline serving
    stayed safe. Now that the accepted set is wider, the disposition follows the type.

    `nosniff` is what makes the declared type binding — without it the browser may
    second-guess it and render something else. `sandbox` neuters anything that still
    manages to be treated as a document.
  */
  const rendersInline = image.mimeType.startsWith('image/');

  return new NextResponse(image.stream, {
    status: 200,
    headers: {
      'Content-Type': image.mimeType,
      'Content-Length': String(image.size),
      'Content-Disposition': rendersInline ? 'inline' : `attachment; filename="${toHeaderFileName(image.fileName)}"`,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': 'sandbox',
      /*
        Private, and that is not boilerplate here: the same URL returns bytes for one
        account and 404 for another, so a shared cache holding the first answer would hand
        a teachers-only picture to the next student through the proxy.
      */
      'Cache-Control': 'private, no-store',
    },
  });
}
