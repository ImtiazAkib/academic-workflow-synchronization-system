import { z } from 'zod';

import { userFields } from './user-fields.schema';

/*
  An administrator creates every account — there is no public sign-up — so the role
  is chosen here rather than defaulting. Optional text fields accept an empty string
  because that is what an untouched form input actually submits.
*/
export const UserCreateSchema = z.object({
  name: userFields.name,
  email: userFields.email,
  password: userFields.password,
  role: userFields.role,
  designation: userFields.designation.optional().or(z.literal('')),
  roll: userFields.roll.optional().or(z.literal('')),
  semester: userFields.semester.optional(),
  phone: userFields.phone.optional().or(z.literal('')),
});

export type UserCreateInput = z.input<typeof UserCreateSchema>;
export type UserCreateOutput = z.output<typeof UserCreateSchema>;
