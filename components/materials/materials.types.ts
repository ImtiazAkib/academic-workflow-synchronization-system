import type { MaterialErrorLabels } from '@/lib/utils';

/**
 * A course as the picker needs one.
 */
export type MaterialCourseOption = {
  courseId: string;
  code: string;
  title: string;
};

export type MaterialsLabels = {
  title: string;
  intro: string;
  count: string;
  uploadTitle: string;
  uploadDescription: string;
  fieldCourse: string;
  fieldTitle: string;
  fieldFile: string;
  uploadSubmit: string;
  uploading: string;
  storageWarning: string;
  storageFull: string;
  tableLabel: string;
  columnTitle: string;
  columnCourse: string;
  columnSize: string;
  columnActions: string;
  download: string;
  remove: string;
  emptyTitle: string;
  emptyDescription: string;
  deleteTitle: string;
  deleteDescription: string;
  deleteConfirm: string;
  deleting: string;
  cancel: string;
  toastUploaded: string;
  toastDeleted: string;
  errors: MaterialErrorLabels;
};
