import { CODES } from '@/constants/codes.const';
import { DEFAULT_TIMEZONE } from '@/constants/datetime.const';
import { TEACHING_DAYS } from '@/constants/schedule.const';

import type { ClassSessionDto, DayOfWeek } from '@/types';

const VALIDATION = CODES.VALIDATION.SCHEDULE;
const BUSINESS = CODES.BUSINESS.SCHEDULE;
const AUTH = CODES.AUTH.SCHEDULE;

export type ScheduleErrorLabels = {
  teacherBusy: string;
  notOwnClass: string;
  courseScheduled: string;
  notFound: string;
  courseMissing: string;
  teacherMissing: string;
  generic: string;
};

/**
 * Turn a refusal code from a schedule action into a sentence the administrator reads.
 *
 * @param code - Error code from the failed action.
 * @param labels - Translated messages, one per refusal.
 *
 * @returns The message to show.
 */
export function resolveScheduleErrorMessage(code: number, labels: ScheduleErrorLabels): string {
  if (code === AUTH.NOT_OWN_CLASS.CODE) {
    return labels.notOwnClass;
  }

  if (code === BUSINESS.TEACHER_BUSY.CODE) {
    return labels.teacherBusy;
  }

  if (code === BUSINESS.COURSE_ALREADY_SCHEDULED.CODE) {
    return labels.courseScheduled;
  }

  if (code === VALIDATION.SESSION_NOT_FOUND.CODE) {
    return labels.notFound;
  }

  if (code === VALIDATION.COURSE_NOT_FOUND.CODE) {
    return labels.courseMissing;
  }

  if (code === VALIDATION.TEACHER_NOT_FOUND.CODE || code === VALIDATION.TEACHER_INVALID_ROLE.CODE) {
    return labels.teacherMissing;
  }

  return labels.generic;
}

/**
 * The department's name for a semester: 1 becomes `1y-1st`, 8 becomes `4y-2nd`.
 *
 * Not an `l10n` key. Like a course code — `CSE-401` — it is an identifier the
 * department writes the same way in both languages, and the Bangla column already
 * keeps Latin digits for exactly this reason.
 *
 * @param semester - Stored semester, 1 through 8.
 *
 * @returns The label to render.
 */
export function resolveSemesterLabel(semester: number): string {
  const year = Math.ceil(semester / 2);
  const half = semester % 2 === 1 ? '1st' : '2nd';

  return `${year}y-${half}`;
}

const WEEKDAY_INDEX: Record<string, DayOfWeek> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/**
 * Which day it is in the department's timezone.
 *
 * Deliberately not `getDay()`. The stored times are bare `HH:mm` and need no
 * conversion, but "which column is today" does: a Vercel instance runs UTC, so after
 * 6pm in Dhaka `new Date().getDay()` still reports yesterday and would highlight the
 * wrong column for six hours of every evening.
 *
 * @param now - The instant to resolve, passed in so the caller owns the clock.
 *
 * @returns The weekday in `Asia/Dhaka`, indexed to match `dayOfWeek`.
 */
export function resolveDepartmentToday(now: Date): DayOfWeek {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: DEFAULT_TIMEZONE, weekday: 'short' }).format(now);

  return WEEKDAY_INDEX[weekday] ?? 0;
}

/**
 * Whether two time ranges on the same day overlap.
 *
 * Half-open on purpose: a class ending at 10:00 does not clash with one starting at
 * 10:00, which is the normal back-to-back slot. Both values are zero-padded `HH:mm`,
 * so a plain string comparison is also a chronological one — no Date parsing, and no
 * timezone to get wrong.
 *
 * @param firstStart - Start of the first range.
 * @param firstEnd - End of the first range.
 * @param secondStart - Start of the second range.
 * @param secondEnd - End of the second range.
 *
 * @returns True when the two ranges share any minute.
 */
export function timeRangesOverlap(firstStart: string, firstEnd: string, secondStart: string, secondEnd: string): boolean {
  return firstStart < secondEnd && secondStart < firstEnd;
}

/**
 * Group sessions by the day they fall on.
 *
 * Every teaching day gets an entry even when nothing is scheduled, so the grid can
 * render an empty column rather than collapsing it and shifting the week.
 *
 * @param sessions - Sessions to arrange.
 *
 * @returns One entry per teaching day, each sorted by start time.
 */
export function groupSessionsByDay(sessions: ClassSessionDto[]): Record<DayOfWeek, ClassSessionDto[]> {
  const grouped = {} as Record<DayOfWeek, ClassSessionDto[]>;

  TEACHING_DAYS.forEach(day => {
    grouped[day] = [];
  });

  sessions.forEach(x => {
    // A make-up class on a weekend is stored but has no column to sit in.
    if (grouped[x.dayOfWeek]) {
      grouped[x.dayOfWeek].push(x);
    }
  });

  TEACHING_DAYS.forEach(day => {
    grouped[day].sort((first, second) => first.startTime.localeCompare(second.startTime));
  });

  return grouped;
}

/**
 * The time span a week of sessions covers, rounded out to whole hours.
 *
 * Derived from the data rather than fixed at 08:00–17:00, so a department that starts
 * at seven does not lose its first class off the top of the grid.
 *
 * @param sessions - Sessions in view.
 *
 * @returns Earliest and latest hour to render, as `HH:mm`.
 */
export function resolveScheduleBounds(sessions: ClassSessionDto[]): { startHour: number; endHour: number } {
  if (sessions.length === 0) {
    return { startHour: 8, endHour: 17 };
  }

  const starts = sessions.map(x => Number(x.startTime.slice(0, 2)));
  const ends = sessions.map(x => Math.ceil(Number(x.endTime.slice(0, 2)) + (x.endTime.slice(3) === '00' ? 0 : 1)));

  return {
    startHour: Math.min(...starts),
    endHour: Math.max(...ends),
  };
}
