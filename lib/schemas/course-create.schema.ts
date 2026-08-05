import { z } from 'zod';

import { SEMESTER } from '@/constants/schedule.const';

import { objectIdField } from './object-id.schema';

export const CourseCreateSchema = z.object({
  code: z.string().trim().toUpperCase().min(2, 'Course code is required.').max(20, 'Course code cannot exceed 20 characters.'),
  title: z.string().trim().min(1, 'Title is required.').max(200, 'Title cannot exceed 200 characters.'),
  semester: z.coerce.number().int().min(SEMESTER.MIN, `Semester must be between ${SEMESTER.MIN} and ${SEMESTER.MAX}.`).max(SEMESTER.MAX),
  credits: z.coerce.number().min(0, 'Credits cannot be negative.').max(10, 'Credits cannot exceed 10.'),
  // A course can exist before anyone is assigned to teach it.
  assignedTeacherId: objectIdField.optional().or(z.literal('')),
});

export type CourseCreateInput = z.input<typeof CourseCreateSchema>;
export type CourseCreateOutput = z.output<typeof CourseCreateSchema>;
