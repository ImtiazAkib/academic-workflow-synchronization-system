import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/auth';
import { isSuccess } from '@/lib/result';
import { NoticeService } from '@/lib/services';

const noticeService = new NoticeService();

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
    Served `inline`, unlike a material — which is deliberately `attachment` so the browser
    never renders it. An image in a notice has to render, so the safety has to come from
    what may be uploaded instead: `NOTICE_IMAGE_MIME_TYPES` is three raster formats and no
    SVG, because an SVG is a document that can carry script and this origin holds the
    session cookie.

    `nosniff` is what makes that list binding — without it the browser may second-guess
    the declared type and render something else. `sandbox` neuters anything that still
    manages to be treated as a document.
  */
  return new NextResponse(image.stream, {
    status: 200,
    headers: {
      'Content-Type': image.mimeType,
      'Content-Length': String(image.size),
      'Content-Disposition': 'inline',
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
