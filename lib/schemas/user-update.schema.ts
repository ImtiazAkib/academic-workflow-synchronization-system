import { z } from 'zod';

import { objectIdField } from './object-id.schema';
import { userFields } from './user-fields.schema';

/*
  No password and no email. A password change is its own action with its own
  confirmation, and an email change moves the account's identity — neither belongs
  in the same form as a phone number.
*/
export const UserUpdateSchema = z.object({
  userId: objectIdField,
  name: userFields.name,
  role: userFields.role,
  designation: userFields.designation.optional().or(z.literal('')),
  studentId: userFields.studentId.optional().or(z.literal('')),
  phone: userFields.phone.optional().or(z.literal('')),
});

export type UserUpdateInput = z.input<typeof UserUpdateSchema>;
export type UserUpdateOutput = z.output<typeof UserUpdateSchema>;
