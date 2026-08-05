import { z } from 'zod';

import { CODES } from '@/constants/codes.const';

import { encodeZodMessage } from '@/lib/utils';

import { userFields } from './user-fields.schema';

const USERS = CODES.VALIDATION.USERS;

/*
  The password is only checked for presence. A length rule here would reject a valid
  existing password if the policy ever changes, and reveals the policy to anyone with
  the sign-in page open. Strength is enforced where passwords are set, not used.
*/
export const SignInSchema = z.object({
  email: userFields.email,
  password: z.string().min(1, encodeZodMessage(USERS.PASSWORD_TOO_SHORT.CODE, 'Password is required.')),
});

export type SignInInput = z.input<typeof SignInSchema>;
export type SignInOutput = z.output<typeof SignInSchema>;
