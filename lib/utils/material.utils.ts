import { CODES } from '@/constants/codes.const';

const VALIDATION = CODES.VALIDATION.MATERIALS;
const AUTH = CODES.AUTH.MATERIALS;

export type MaterialErrorLabels = {
  fileRequired: string;
  fileTooLarge: string;
  fileType: string;
  titleRequired: string;
  notOwnCourse: string;
  notOwnFile: string;
  notFound: string;
  courseNotFound: string;
  generic: string;
};

/**
 * Turn a refusal code from an upload or delete into a sentence the teacher reads.
 *
 * @param code - Error code from the failed request.
 * @param labels - Translated messages, one per refusal.
 *
 * @returns The message to show.
 */
export function resolveMaterialErrorMessage(code: number, labels: MaterialErrorLabels): string {
  if (code === VALIDATION.FILE_REQUIRED.CODE) {
    return labels.fileRequired;
  }

  if (code === VALIDATION.FILE_TOO_LARGE.CODE) {
    return labels.fileTooLarge;
  }

  if (code === VALIDATION.FILE_TYPE_NOT_ALLOWED.CODE) {
    return labels.fileType;
  }

  if (code === VALIDATION.TITLE_REQUIRED.CODE || code === VALIDATION.TITLE_TOO_LONG.CODE) {
    return labels.titleRequired;
  }

  if (code === VALIDATION.COURSE_NOT_FOUND.CODE) {
    return labels.courseNotFound;
  }

  if (code === VALIDATION.MATERIAL_NOT_FOUND.CODE) {
    return labels.notFound;
  }

  if (code === AUTH.NOT_OWN_COURSE.CODE) {
    return labels.notOwnCourse;
  }

  if (code === AUTH.NOT_OWN_MATERIAL.CODE) {
    return labels.notOwnFile;
  }

  return labels.generic;
}

const UNITS = ['B', 'KB', 'MB'] as const;

/**
 * A byte count as something a person reads.
 *
 * Latin digits and SI-ish suffixes, left untranslated for the same reason a course code
 * is: `2.4 MB` reads the same in both languages the app ships.
 *
 * @param bytes - Size on disk.
 *
 * @returns A short human-readable size.
 */
export function formatFileSize(bytes: number): string {
  let size = bytes;
  let unit = 0;

  while (size >= 1024 && unit < UNITS.length - 1) {
    size /= 1024;
    unit++;
  }

  return `${unit === 0 ? size : size.toFixed(1)} ${UNITS[unit]}`;
}
