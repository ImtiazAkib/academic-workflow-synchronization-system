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
  uploadCta: string;
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
  columnDate: string;
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
  searchLabel: string;
  searchPlaceholder: string;
  courseFilter: string;
  typeFilter: string;
  allCourses: string;
  allTypes: string;
  typePdf: string;
  typeDocument: string;
  typePresentation: string;
  typeSpreadsheet: string;
  typeImage: string;
  typeArchive: string;
  typeText: string;
  sortLabel: string;
  sortName: string;
  sortSize: string;
  sortDate: string;
  dropzone: string;
  errors: MaterialErrorLabels;
};
