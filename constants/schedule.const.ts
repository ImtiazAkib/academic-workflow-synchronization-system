import { DayOfWeek } from '@/types';

/**
 * Every day the model accepts, indexed to match `Date.getDay()`.
 */
export const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] as const satisfies readonly DayOfWeek[];

/**
 * The days classes are normally scheduled on — Sunday to Thursday.
 * Used to order the timetable grid, not to reject a make-up class on a weekend.
 */
export const TEACHING_DAYS = [0, 1, 2, 3, 4] as const satisfies readonly DayOfWeek[];

/**
 * 24-hour `HH:mm`. Zero-padded, so string comparison is also chronological —
 * which is what makes overlap detection a plain `<` between two values.
 */
export const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const SEMESTER = {
  MIN: 1,
  MAX: 12,
} as const;
