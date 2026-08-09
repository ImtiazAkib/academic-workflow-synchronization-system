import { z } from 'zod';

import { CODES } from '@/constants/codes.const';
import { NOTICE_AUDIENCES, NOTICE_IMAGE, NOTICE_IMAGE_EXTENSIONS, NOTICE_IMAGE_MIME_TYPES } from '@/constants/notice.const';

import { encodeZodMessage } from '@/lib/utils';

const NOTICES = CODES.VALIDATION.NOTICES;

/**
 * Whether the file's name ends in something the department accepts.
 *
 * @param fileName - Name as uploaded.
 *
 * @returns True when the extension is on the list.
 */
function hasAllowedExtension(fileName: string): boolean {
  const lowered = fileName.toLowerCase();

  return NOTICE_IMAGE_EXTENSIONS.some(extension => lowered.endsWith(extension));
}

/*
  The messages carried plain strings until now. That was deliberate rather than an
  oversight — `user-fields.schema.ts` says it in as many words: only the schemas already
  consumed by a service carry codes, and the rest get theirs when the services that raise
  them land. `NoticeService` lands in this step, so these become encoded.

  What is absent: `publishedBy` and `publishedAt`. The author is the session, not a form
  field, and the date is the moment the write happens — a notice that could name somebody
  else as its publisher would let an administrator put words in a colleague's mouth.

  Every file check here runs on the server, against the bytes that actually arrived. The
  `accept` attribute on the input is a convenience for whoever is publishing; a request
  built by hand skips it. `image.size` is trustworthy — it is the length of what was
  received. `image.type` is not, so it is checked together with the extension, and neither
  proves what the bytes contain. Only the magic number does, and `NoticeService` reads it.
*/
export const NoticeCreateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, encodeZodMessage(NOTICES.TITLE_REQUIRED.CODE, NOTICES.TITLE_REQUIRED.MESSAGE))
      .max(200, encodeZodMessage(NOTICES.TITLE_TOO_LONG.CODE, NOTICES.TITLE_TOO_LONG.MESSAGE)),

    /*
      No `min(1)`, unlike every other required text field in the app. An empty body is a
      legitimate notice as long as there is a picture, so "is there anything here at all"
      is a question about the pair rather than about this field — and it is asked once,
      below, instead of twice with two different answers.
    */
    body: z.string().trim().max(5000, encodeZodMessage(NOTICES.BODY_TOO_LONG.CODE, NOTICES.BODY_TOO_LONG.MESSAGE)).optional(),

    image: z
      .instanceof(File)
      .refine(x => x.size <= NOTICE_IMAGE.MAX_SIZE_BYTES, encodeZodMessage(NOTICES.IMAGE_TOO_LARGE.CODE, NOTICES.IMAGE_TOO_LARGE.MESSAGE))
      .refine(
        x => NOTICE_IMAGE_MIME_TYPES.includes(x.type as (typeof NOTICE_IMAGE_MIME_TYPES)[number]) && hasAllowedExtension(x.name),
        encodeZodMessage(NOTICES.IMAGE_TYPE_NOT_ALLOWED.CODE, NOTICES.IMAGE_TYPE_NOT_ALLOWED.MESSAGE)
      )
      .optional(),

    audience: z.enum(Object.values(NOTICE_AUDIENCES), encodeZodMessage(NOTICES.AUDIENCE_INVALID.CODE, NOTICES.AUDIENCE_INVALID.MESSAGE)),
  })
  /*
    Text, a picture, or both — but not neither. Reported against `body`, so the message
    lands under the textarea rather than floating above the form: somebody who announced
    nothing is already looking there.
  */
  .refine(x => Boolean(x.body) || x.image !== undefined, {
    message: encodeZodMessage(NOTICES.BODY_OR_IMAGE_REQUIRED.CODE, NOTICES.BODY_OR_IMAGE_REQUIRED.MESSAGE),
    path: ['body'],
  });

export type NoticeCreateInput = z.input<typeof NoticeCreateSchema>;
export type NoticeCreateOutput = z.output<typeof NoticeCreateSchema>;
