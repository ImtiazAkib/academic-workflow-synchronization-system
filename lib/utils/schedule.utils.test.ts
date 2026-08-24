import { describe, expect, it } from 'vitest';

import { findScheduleConflicts, timeRangesOverlap } from '@/lib/utils';

import type { ClassSessionDto } from '@/types';

function session(overrides: Partial<ClassSessionDto>): ClassSessionDto {
  return {
    classSessionId: 'id',
    courseId: 'course',
    teacherId: 'teacher-a',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
    semester: 1,
    isCancelled: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('timeRangesOverlap', () => {
  it('is true when the ranges share a minute', () => {
    expect(timeRangesOverlap('09:00', '10:00', '09:30', '10:30')).toBe(true);
  });

  it('is false for back-to-back ranges, since the interval is half-open', () => {
    expect(timeRangesOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false);
  });

  it('is false for disjoint ranges', () => {
    expect(timeRangesOverlap('09:00', '10:00', '11:00', '12:00')).toBe(false);
  });

  it('is true when one range fully contains the other', () => {
    expect(timeRangesOverlap('09:00', '12:00', '10:00', '11:00')).toBe(true);
  });
});

describe('findScheduleConflicts', () => {
  it('flags two overlapping classes for the same teacher on the same day', () => {
    const conflicts = findScheduleConflicts([
      session({ classSessionId: 'a', startTime: '09:00', endTime: '10:00' }),
      session({ classSessionId: 'b', startTime: '09:30', endTime: '10:30' }),
    ]);

    expect(conflicts).toHaveLength(1);
  });

  it('does not flag overlapping classes for different teachers', () => {
    const conflicts = findScheduleConflicts([
      session({ teacherId: 'teacher-a', startTime: '09:00', endTime: '10:00' }),
      session({ teacherId: 'teacher-b', startTime: '09:30', endTime: '10:30' }),
    ]);

    expect(conflicts).toHaveLength(0);
  });

  it('does not flag back-to-back classes for the same teacher', () => {
    const conflicts = findScheduleConflicts([session({ startTime: '09:00', endTime: '10:00' }), session({ startTime: '10:00', endTime: '11:00' })]);

    expect(conflicts).toHaveLength(0);
  });

  it('excludes a cancelled class from conflicts', () => {
    const conflicts = findScheduleConflicts([
      session({ startTime: '09:00', endTime: '10:00' }),
      session({ startTime: '09:30', endTime: '10:30', isCancelled: true }),
    ]);

    expect(conflicts).toHaveLength(0);
  });

  it('does not flag overlaps that fall on different days', () => {
    const conflicts = findScheduleConflicts([
      session({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }),
      session({ dayOfWeek: 2, startTime: '09:30', endTime: '10:30' }),
    ]);

    expect(conflicts).toHaveLength(0);
  });
});
