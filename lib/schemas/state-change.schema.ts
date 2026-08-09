import { z } from 'zod';

import { objectIdField } from './object-id.schema';

/*
  The two "flip a flag" inputs, as objects rather than positional arguments.

  Both used to take `(id: unknown, flag: boolean)` and validate only the id. The boolean
  was a compile-time annotation, which is erased at runtime — so the one thing these
  actions exist to write was the one thing nobody checked. Mongoose's cast would have
  caught most junk on the way to the column, but "validated" is one of the four properties
  every action is meant to have, and three-quarters of one is how the fourth goes missing.

  Objects rather than two parsed arguments, matching `UserApproveSchema` and
  `UserActivateSchema`: one `safeParse` per action, one shape to read at the call site,
  and no pairing of positions to remember.
*/
export const CourseActivateSchema = z.object({
  courseId: objectIdField,
  isActive: z.boolean(),
});

export type CourseActivateInput = z.input<typeof CourseActivateSchema>;
export type CourseActivateOutput = z.output<typeof CourseActivateSchema>;

export const ClassSessionCancelSchema = z.object({
  classSessionId: objectIdField,
  isCancelled: z.boolean(),
});

export type ClassSessionCancelInput = z.input<typeof ClassSessionCancelSchema>;
export type ClassSessionCancelOutput = z.output<typeof ClassSessionCancelSchema>;
