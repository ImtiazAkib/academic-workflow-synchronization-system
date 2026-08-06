import { CODES } from '@/constants/codes.const';

const VALIDATION = CODES.VALIDATION.COURSES;
const BUSINESS = CODES.BUSINESS.COURSES;

export type CourseErrorLabels = {
  codeTaken: string;
  notFound: string;
  hasSessions: string;
  teacherInvalid: string;
  generic: string;
};

/**
 * Turn a refusal code from a course action into a sentence the administrator reads.
 *
 * Actions return codes rather than sentences because only the client holds the
 * translated strings — they arrive as props from the page.
 *
 * @param code - Error code from the failed action.
 * @param labels - Translated messages, one per refusal.
 *
 * @returns The message to show.
 */
export function resolveCourseErrorMessage(code: number, labels: CourseErrorLabels): string {
  if (code === VALIDATION.CODE_ALREADY_USED.CODE) {
    return labels.codeTaken;
  }

  if (code === VALIDATION.COURSE_NOT_FOUND.CODE) {
    return labels.notFound;
  }

  if (code === VALIDATION.TEACHER_NOT_FOUND.CODE || code === VALIDATION.TEACHER_INVALID_ROLE.CODE) {
    return labels.teacherInvalid;
  }

  if (code === BUSINESS.COURSE_HAS_SESSIONS.CODE) {
    return labels.hasSessions;
  }

  return labels.generic;
}
