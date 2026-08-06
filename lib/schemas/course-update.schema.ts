import { z } from 'zod';

import { SEMESTER } from '@/constants/schedule.const';

import { objectIdField } from './object-id.schema';

/*
  The code is editable here, unlike a user's email: a course code is a label the
  department controls, not the identity someone signs in with. The service still
  refuses a code another course already holds.
*/
export const CourseUpdateSchema = z.object({
  courseId: objectIdField,
  code: z.string().trim().toUpperCase().min(2, 'Course code is required.').max(20, 'Course code cannot exceed 20 characters.'),
  title: z.string().trim().min(1, 'Title is required.').max(200, 'Title cannot exceed 200 characters.'),
  semester: z.coerce.number().int().min(SEMESTER.MIN, `Semester must be between ${SEMESTER.MIN} and ${SEMESTER.MAX}.`).max(SEMESTER.MAX),
  credits: z.coerce.number().min(0, 'Credits cannot be negative.').max(10, 'Credits cannot exceed 10.'),
  assignedTeacherId: objectIdField.optional().or(z.literal('')),
});

export type CourseUpdateInput = z.input<typeof CourseUpdateSchema>;
export type CourseUpdateOutput = z.output<typeof CourseUpdateSchema>;
