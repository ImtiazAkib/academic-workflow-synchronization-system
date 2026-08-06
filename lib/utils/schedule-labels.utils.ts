import type { DayLabels, ScheduleLabels } from '@/components/schedule';

import type { getTranslations } from 'next-intl/server';

// Type-only: `next-intl/server` reaches for `next/headers`, which a client bundle
// cannot resolve. Only the translator's shape is needed here.
type Translator = Awaited<ReturnType<typeof getTranslations>>;

/**
 * The seven weekday names.
 *
 * Written as seven literal `l10n('KEY')` calls rather than a loop over the day index,
 * because the editor integration only finds keys in their literal call form — the same
 * reason `resolveRoleLabel` is a chain of ifs.
 *
 * @param l10n - Translator from the calling server component.
 *
 * @returns One label per weekday, indexed to match `dayOfWeek`.
 */
export function buildDayLabels(l10n: Translator): DayLabels {
  return {
    0: l10n('SCHEDULE_DAY_0'),
    1: l10n('SCHEDULE_DAY_1'),
    2: l10n('SCHEDULE_DAY_2'),
    3: l10n('SCHEDULE_DAY_3'),
    4: l10n('SCHEDULE_DAY_4'),
    5: l10n('SCHEDULE_DAY_5'),
    6: l10n('SCHEDULE_DAY_6'),
  };
}

/**
 * Every string the timetable renders.
 *
 * Shared by the administrator screen and the teacher's read-only view so the two cannot
 * drift — a class card looks the same whoever is reading it.
 *
 * @param l10n - Translator from the calling server component.
 * @param count - Already-interpolated heading for the number of classes in view.
 *
 * @returns The full label bundle.
 */
export function buildScheduleLabels(l10n: Translator, count: string): ScheduleLabels {
  return {
    createCta: l10n('SCHEDULE_CREATE_CTA'),
    semesterFilter: l10n('SCHEDULE_FILTERS_SEMESTER_LABEL'),
    teacherFilter: l10n('SCHEDULE_FILTERS_TEACHER_LABEL'),
    all: l10n('SCHEDULE_FILTERS_ALL'),
    clearFilters: l10n('SCHEDULE_FILTERS_CLEAR'),
    days: buildDayLabels(l10n),
    today: l10n('SCHEDULE_TODAY'),
    room: l10n('SCHEDULE_ROOM'),
    count,
    emptyTitle: l10n('SCHEDULE_EMPTY_TITLE'),
    emptyDescription: l10n('SCHEDULE_EMPTY_DESCRIPTION'),
    dayEmpty: l10n('SCHEDULE_DAY_EMPTY'),
    edit: l10n('SCHEDULE_ACTION_EDIT'),
    remove: l10n('SCHEDULE_ACTION_DELETE'),
    fields: {
      course: l10n('SCHEDULE_FIELD_COURSE_LABEL'),
      teacher: l10n('SCHEDULE_FIELD_TEACHER_LABEL'),
      room: l10n('SCHEDULE_FIELD_ROOM_LABEL'),
      day: l10n('SCHEDULE_FIELD_DAY_LABEL'),
      startTime: l10n('SCHEDULE_FIELD_START_LABEL'),
      endTime: l10n('SCHEDULE_FIELD_END_LABEL'),
      semester: l10n('SCHEDULE_FIELD_SEMESTER_LABEL'),
    },
    fieldErrors: {
      courseRequired: l10n('SCHEDULE_FIELD_COURSE_REQUIRED'),
      teacherRequired: l10n('SCHEDULE_FIELD_TEACHER_REQUIRED'),
      roomRequired: l10n('SCHEDULE_FIELD_ROOM_REQUIRED'),
      timeInvalid: l10n('SCHEDULE_FIELD_TIME_INVALID'),
      endBeforeStart: l10n('SCHEDULE_FIELD_END_BEFORE_START'),
    },
    conflictTitle: l10n('SCHEDULE_CONFLICT_TITLE'),
    editTitle: l10n('SCHEDULE_EDIT_TITLE'),
    editDescription: l10n('SCHEDULE_EDIT_DESCRIPTION'),
    editSubmit: l10n('SCHEDULE_EDIT_SUBMIT'),
    deleteDialog: {
      title: l10n('SCHEDULE_DELETE_TITLE'),
      description: l10n('SCHEDULE_DELETE_DESCRIPTION'),
      confirm: l10n('SCHEDULE_DELETE_CONFIRM'),
    },
    cancel: l10n('SCHEDULE_DIALOG_CANCEL'),
    working: l10n('SCHEDULE_DIALOG_WORKING'),
    toastUpdated: l10n('SCHEDULE_TOAST_UPDATED'),
    toastDeleted: l10n('SCHEDULE_TOAST_DELETED'),
    errors: {
      roomTaken: l10n('SCHEDULE_ERROR_ROOM_TAKEN'),
      teacherBusy: l10n('SCHEDULE_ERROR_TEACHER_BUSY'),
      courseScheduled: l10n('SCHEDULE_ERROR_COURSE_SCHEDULED'),
      notFound: l10n('SCHEDULE_ERROR_NOT_FOUND'),
      courseMissing: l10n('SCHEDULE_ERROR_COURSE_MISSING'),
      teacherMissing: l10n('SCHEDULE_ERROR_TEACHER_MISSING'),
      generic: l10n('SCHEDULE_ERROR_GENERIC'),
    },
  };
}
