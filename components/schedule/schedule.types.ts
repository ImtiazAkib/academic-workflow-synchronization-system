import type { ScheduleErrorLabels } from '@/lib/utils';

import type { DayOfWeek } from '@/types';

/**
 * A course as the picker needs one — enough to identify it in a list, nothing more.
 */
export type CourseOption = {
  courseId: string;
  code: string;
  title: string;
};

export type TeacherOption = {
  userId: string;
  name: string;
};

export type ScheduleFieldLabels = {
  course: string;
  teacher: string;
  day: string;
  startTime: string;
  endTime: string;
  semester: string;
};

export type ScheduleFieldErrorLabels = {
  courseRequired: string;
  teacherRequired: string;
  timeInvalid: string;
  endBeforeStart: string;
};

export type ScheduleConfirmLabels = {
  title: string;
  description: string;
  confirm: string;
};

/**
 * One translated name per weekday, indexed the way `dayOfWeek` is.
 */
export type DayLabels = Record<DayOfWeek, string>;

export type SessionFormLabels = {
  fields: ScheduleFieldLabels;
  fieldErrors: ScheduleFieldErrorLabels;
  days: DayLabels;
  conflictTitle: string;
  submit: string;
  working: string;
  cancel: string;
  saved: string;
  errors: ScheduleErrorLabels;
};

export type ScheduleLabels = {
  createCta: string;
  semesterFilter: string;
  teacherFilter: string;
  all: string;
  clearFilters: string;
  days: DayLabels;
  today: string;
  count: string;
  statusCancelled: string;
  cancel: string;
  restore: string;
  emptyTitle: string;
  emptyDescription: string;
  dayEmpty: string;
  edit: string;
  remove: string;
  fields: ScheduleFieldLabels;
  fieldErrors: ScheduleFieldErrorLabels;
  conflictTitle: string;
  editTitle: string;
  editDescription: string;
  editSubmit: string;
  deleteDialog: ScheduleConfirmLabels;
  cancelDialog: ScheduleConfirmLabels;
  restoreDialog: ScheduleConfirmLabels;
  dialogCancel: string;
  working: string;
  toastUpdated: string;
  toastDeleted: string;
  toastCancelled: string;
  toastRestored: string;
  errors: ScheduleErrorLabels;
};
