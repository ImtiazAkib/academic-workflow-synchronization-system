import { z } from 'zod';

import { DAYS_OF_WEEK, SEMESTER, TIME_OF_DAY_PATTERN } from '@/constants/schedule.const';

import { objectIdField } from './object-id.schema';

const timeOfDayField = z.string().trim().regex(TIME_OF_DAY_PATTERN, 'Use a 24-hour time, for example 09:30.');

/*
  Shape only. Whether the slot is *free* — same room, same teacher, same course
  already booked — is a business rule the scheduling service answers against the
  database, not something a schema can see.
*/
export const ClassSessionCreateSchema = z
  .object({
    courseId: objectIdField,
    teacherId: objectIdField,
    room: z.string().trim().min(1, 'Room is required.').max(40, 'Room cannot exceed 40 characters.'),
    dayOfWeek: z.coerce.number().refine(value => DAYS_OF_WEEK.includes(value as (typeof DAYS_OF_WEEK)[number]), 'Choose a valid day.'),
    startTime: timeOfDayField,
    endTime: timeOfDayField,
    semester: z.coerce.number().int().min(SEMESTER.MIN, `Semester must be between ${SEMESTER.MIN} and ${SEMESTER.MAX}.`).max(SEMESTER.MAX),
  })
  .refine(value => value.startTime < value.endTime, {
    message: 'End time must be later than start time.',
    path: ['endTime'],
  });

export type ClassSessionCreateInput = z.input<typeof ClassSessionCreateSchema>;
export type ClassSessionCreateOutput = z.output<typeof ClassSessionCreateSchema>;
