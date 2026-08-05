import { z } from 'zod';

import { NOTICE_AUDIENCES } from '@/constants/notice.const';

export const NoticeCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200, 'Title cannot exceed 200 characters.'),
  body: z.string().trim().min(1, 'Write something to announce.').max(5000, 'A notice cannot exceed 5000 characters.'),
  audience: z.enum(Object.values(NOTICE_AUDIENCES), 'Choose who this notice is for.'),
});

export type NoticeCreateInput = z.input<typeof NoticeCreateSchema>;
export type NoticeCreateOutput = z.output<typeof NoticeCreateSchema>;
