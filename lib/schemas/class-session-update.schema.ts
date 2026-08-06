import { z } from 'zod';

import { DAYS_OF_WEEK, SEMESTER, TIME_OF_DAY_PATTERN } from '@/constants/schedule.const';

import { objectIdField } from './object-id.schema';

import type { DayOfWeek } from '@/types';

const timeOfDayField = z.string().trim().regex(TIME_OF_DAY_PATTERN, 'Use a 24-hour time, for example 09:30.');

/*
  The create schema plus the id of the session being moved. Kept as its own object
  rather than an `extend()` of the create schema, because that one ends in `.refine()`
  and a refined schema cannot be extended.
*/
export const ClassSessionUpdateSchema = z
  .object({
    classSessionId: objectIdField,
    courseId: objectIdField,
    teacherId: objectIdField,
    room: z.string().trim().min(1, 'Room is required.').max(40, 'Room cannot exceed 40 characters.'),
    dayOfWeek: z.coerce.number().refine((value): value is DayOfWeek => DAYS_OF_WEEK.includes(value as DayOfWeek), 'Choose a valid day.'),
    startTime: timeOfDayField,
    endTime: timeOfDayField,
    semester: z.coerce.number().int().min(SEMESTER.MIN, `Semester must be between ${SEMESTER.MIN} and ${SEMESTER.MAX}.`).max(SEMESTER.MAX),
  })
  .refine(value => value.startTime < value.endTime, {
    message: 'End time must be later than start time.',
    path: ['endTime'],
  });

export type ClassSessionUpdateInput = z.input<typeof ClassSessionUpdateSchema>;
export type ClassSessionUpdateOutput = z.output<typeof ClassSessionUpdateSchema>;
