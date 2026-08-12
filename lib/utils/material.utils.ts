import { CODES } from '@/constants/codes.const';

import type { MaterialDto } from '@/types';

const VALIDATION = CODES.VALIDATION.MATERIALS;
const AUTH = CODES.AUTH.MATERIALS;
const BUSINESS = CODES.BUSINESS.COMMON;

export type MaterialErrorLabels = {
  fileRequired: string;
  fileTooLarge: string;
  fileType: string;
  titleRequired: string;
  notOwnCourse: string;
  notOwnFile: string;
  notFound: string;
  courseNotFound: string;
  storageFull: string;
  generic: string;
};

export type MaterialType = 'pdf' | 'document' | 'presentation' | 'spreadsheet' | 'image' | 'archive' | 'text' | 'file';

/**
 * Categorize a stored material using only its persisted MIME type and filename. This is
 * intentionally presentation-free, so every material surface can choose its own icon.
 */
export function resolveMaterialType(mimeType: string, fileName: string): MaterialType {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (mimeType === 'application/pdf' || extension === 'pdf') return 'pdf';
  if (mimeType.includes('word') || extension === 'doc' || extension === 'docx') return 'document';
  if (mimeType.includes('powerpoint') || extension === 'ppt' || extension === 'pptx') return 'presentation';
  if (mimeType.includes('excel') || extension === 'xls' || extension === 'xlsx') return 'spreadsheet';
  if (mimeType.startsWith('image/') || extension === 'png' || extension === 'jpg' || extension === 'jpeg') return 'image';
  if (mimeType === 'application/zip' || extension === 'zip') return 'archive';
  if (mimeType === 'text/plain' || extension === 'txt') return 'text';

  return 'file';
}

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

  if (code === BUSINESS.STORAGE_FULL.CODE) {
    return labels.storageFull;
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

/**
 * One entry per course, with the files published against it.
 */
export type CourseMaterialGroup<TCourse> = {
  course: TCourse;
  materials: MaterialDto[];
};

/**
 * Arrange files under the course they belong to.
 *
 * Every course keeps its entry even when nothing has been published against it, so the
 * page answers "has anything been uploaded for CSE-401 yet" rather than leaving the
 * course out and the question open.
 *
 * Order comes from the courses passed in — the caller has already sorted them by code —
 * and the files inside each group keep the order they arrived in, which is newest first.
 *
 * @param materials - Files to arrange.
 * @param courses - The courses in view.
 *
 * @returns One group per course, in the order the courses were given.
 */
export function groupMaterialsByCourse<TCourse extends { courseId: string }>(
  materials: MaterialDto[],
  courses: TCourse[]
): CourseMaterialGroup<TCourse>[] {
  const grouped = new Map<string, MaterialDto[]>();

  courses.forEach(x => {
    grouped.set(x.courseId, []);
  });

  materials.forEach(x => {
    // A file whose course is not in view — another semester's — has no group to sit in.
    grouped.get(x.courseId)?.push(x);
  });

  return courses.map(x => ({ course: x, materials: grouped.get(x.courseId) ?? [] }));
}
