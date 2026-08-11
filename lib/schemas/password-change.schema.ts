import { z } from 'zod';

import { CODES } from '@/constants/codes.const';

import { encodeZodMessage } from '@/lib/utils';

import { userFields } from './user-fields.schema';

const USERS = CODES.VALIDATION.USERS;

/*
  Its own action with its own confirmation, deliberately apart from the profile form: a
  password change verifies the current password and needs two boxes that agree, neither of
  which belongs beside a phone number.

  There is no `userId` — the account is the one the session names, like every self-service
  write. `currentPassword` is only checked for presence here; whether it is the *right*
  password is the service's question, because only the stored hash can answer it.
*/
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, encodeZodMessage(USERS.CURRENT_PASSWORD_REQUIRED.CODE, USERS.CURRENT_PASSWORD_REQUIRED.MESSAGE)),
    newPassword: userFields.password,
    confirmPassword: z.string(),
  })
  .refine(values => values.newPassword === values.confirmPassword, {
    message: encodeZodMessage(USERS.PASSWORD_MISMATCH.CODE, USERS.PASSWORD_MISMATCH.MESSAGE),
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.input<typeof ChangePasswordSchema>;
export type ChangePasswordOutput = z.output<typeof ChangePasswordSchema>;
