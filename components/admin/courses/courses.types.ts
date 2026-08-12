import type { CourseErrorLabels } from '@/lib/utils';

/**
 * A teacher as the assignee picker needs one - id and name, nothing else. The screen
 * has no use for the rest of a `UserDto` and should not carry it across the boundary.
 */
export type TeacherOption = {
  userId: string;
  name: string;
};

export type CoursesFieldLabels = {
  code: string;
  title: string;
  semester: string;
  credits: string;
  teacher: string;
  optional: string;
  unassigned: string;
};

export type CoursesFieldErrorLabels = {
  codeRequired: string;
  codeTooLong: string;
  titleRequired: string;
  titleTooLong: string;
  semesterInvalid: string;
  creditsInvalid: string;
};

export type CoursesConfirmLabels = {
  title: string;
  description: string;
  confirm: string;
};

/**
 * Everything the create screen renders - a slice of `CoursesLabels`, since that page
 * has no table, filter or confirmation.
 */
export type CourseCreateFormLabels = {
  fields: CoursesFieldLabels;
  fieldErrors: CoursesFieldErrorLabels;
  submit: string;
  working: string;
  cancel: string;
  created: string;
  errors: CourseErrorLabels;
};

export type CoursesLabels = {
  title: string;
  intro: string;
  createCta: string;
  semesterFilter: string;
  all: string;
  clearFilter: string;
  tableLabel: string;
  columnCode: string;
  columnTitle: string;
  columnSemester: string;
  columnCredits: string;
  columnTeacher: string;
  columnStatus: string;
  columnActions: string;
  count: string;
  statusActive: string;
  statusInactive: string;
  unassigned: string;
  emptyTitle: string;
  emptyDescription: string;
  edit: string;
  deactivate: string;
  reactivate: string;
  fields: CoursesFieldLabels;
  fieldErrors: CoursesFieldErrorLabels;
  editTitle: string;
  editDescription: string;
  editSubmit: string;
  deactivateDialog: CoursesConfirmLabels;
  reactivateDialog: CoursesConfirmLabels;
  cancel: string;
  working: string;
  toastUpdated: string;
  toastDeactivated: string;
  toastReactivated: string;
  errors: CourseErrorLabels;
};
