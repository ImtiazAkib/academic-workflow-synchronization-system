import { NoticeAudience } from '@/types';

export const NOTICE_AUDIENCES = {
  ALL: 'all',
  TEACHERS: 'teachers',
  STUDENTS: 'students',
} as const satisfies Record<string, NoticeAudience>;
