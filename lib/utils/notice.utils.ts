import { CODES } from '@/constants/codes.const';
import { NOTICE_AUDIENCES } from '@/constants/notice.const';

import type { NoticeAudience } from '@/types';

const VALIDATION = CODES.VALIDATION.NOTICES;

export type NoticeErrorLabels = {
  titleRequired: string;
  bodyRequired: string;
  audienceInvalid: string;
  generic: string;
};

/**
 * Turn a refusal code from a notice action into a sentence the administrator reads.
 *
 * Actions return codes rather than sentences because only the client holds the translated
 * strings — they arrive as props from the page.
 *
 * @param code - Error code from the failed action.
 * @param labels - Translated messages, one per refusal.
 *
 * @returns The message to show.
 */
export function resolveNoticeErrorMessage(code: number, labels: NoticeErrorLabels): string {
  if (code === VALIDATION.TITLE_REQUIRED.CODE || code === VALIDATION.TITLE_TOO_LONG.CODE) {
    return labels.titleRequired;
  }

  if (code === VALIDATION.BODY_REQUIRED.CODE || code === VALIDATION.BODY_TOO_LONG.CODE) {
    return labels.bodyRequired;
  }

  if (code === VALIDATION.AUDIENCE_INVALID.CODE) {
    return labels.audienceInvalid;
  }

  return labels.generic;
}

export type NoticeAudienceLabels = {
  all: string;
  teachers: string;
  students: string;
};

/**
 * The already-translated label for an audience.
 *
 * Takes the strings rather than a translator, so it works in a client component that was
 * handed its copy as props — the same shape as `resolveUserRoleLabel`.
 *
 * @param audience - The audience to label.
 * @param labels - Translated audience names.
 *
 * @returns The label to render.
 */
export function resolveNoticeAudienceLabel(audience: NoticeAudience, labels: NoticeAudienceLabels): string {
  if (audience === NOTICE_AUDIENCES.TEACHERS) {
    return labels.teachers;
  }

  if (audience === NOTICE_AUDIENCES.STUDENTS) {
    return labels.students;
  }

  return labels.all;
}
