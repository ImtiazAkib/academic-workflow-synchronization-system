import type { MaterialErrorLabels } from '@/lib/utils';

import type { MultimediaViewerLabels } from '@/components/shared';

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
  /** The dropzone's active line, shown while a file is being dragged over it. */
  dropActive: string;
  /** Clears a chosen file so a different one can be picked. */
  removeFile: string;
  /** The optional-description field label, shared by the upload and edit forms. */
  fieldDescription: string;
  /** The row's edit action. */
  edit: string;
  toastUpdated: string;
  /** The edit dialog's title, and its submit button. */
  editTitle: string;
  editDescription: string;
  editReplace: string;
  editDropActive: string;
  editKeep: string;
  /** The edit form's in-flight submit label. */
  updating: string;
  /** Chrome for the attachment viewer a row opens. */
  viewer: MultimediaViewerLabels;
  errors: MaterialErrorLabels;
};
