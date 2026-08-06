import { TEACHING_DAYS } from '@/constants/schedule.const';

import type { ClassSessionDto, DayOfWeek } from '@/types';

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
