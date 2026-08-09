import { z } from 'zod';

import { CODES } from '@/constants/codes.const';
import { NOTICE_AUDIENCES } from '@/constants/notice.const';

import { encodeZodMessage } from '@/lib/utils';

const NOTICES = CODES.VALIDATION.NOTICES;

/*
  The messages carried plain strings until now. That was deliberate rather than an
  oversight — `user-fields.schema.ts` says it in as many words: only the schemas already
  consumed by a service carry codes, and the rest get theirs when the services that raise
  them land. `NoticeService` lands in this step, so these become encoded.

  What is absent: `publishedBy` and `publishedAt`. The author is the session, not a form
  field, and the date is the moment the write happens — a notice that could name somebody
  else as its publisher would let an administrator put words in a colleague's mouth.
*/
export const NoticeCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, encodeZodMessage(NOTICES.TITLE_REQUIRED.CODE, NOTICES.TITLE_REQUIRED.MESSAGE))
    .max(200, encodeZodMessage(NOTICES.TITLE_TOO_LONG.CODE, NOTICES.TITLE_TOO_LONG.MESSAGE)),

  body: z
    .string()
    .trim()
    .min(1, encodeZodMessage(NOTICES.BODY_REQUIRED.CODE, NOTICES.BODY_REQUIRED.MESSAGE))
    .max(5000, encodeZodMessage(NOTICES.BODY_TOO_LONG.CODE, NOTICES.BODY_TOO_LONG.MESSAGE)),

  audience: z.enum(Object.values(NOTICE_AUDIENCES), encodeZodMessage(NOTICES.AUDIENCE_INVALID.CODE, NOTICES.AUDIENCE_INVALID.MESSAGE)),
});

export type NoticeCreateInput = z.input<typeof NoticeCreateSchema>;
export type NoticeCreateOutput = z.output<typeof NoticeCreateSchema>;
