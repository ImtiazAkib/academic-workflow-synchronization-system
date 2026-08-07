import { z } from 'zod';

import { CODES } from '@/constants/codes.const';

import { encodeZodMessage } from '@/lib/utils';

const USERS = CODES.VALIDATION.USERS;

/*
  One field, not two, and not an email.

  From step 12 a student signs in with `S-2026-0042`, a teacher with `T-2026-0007`, and
  an administrator with their email address. A single identifier field serves all three:
  `AuthService.resolveByIdentifier()` decides which lookup to make from the shape of what
  was typed. The alternative — a role picker beside the password — asks the visitor to
  classify themselves before the app has any reason to care.

  It is deliberately not validated as an email or against the login-ID pattern. A typo
  should be refused by "that identifier and password do not match", the same answer a
  wrong password gets, rather than by a format error that tells an anonymous visitor
  which identifiers exist and what shape they take.

  The password is only checked for presence. A length rule here would reject a valid
  existing password if the policy ever changes, and reveals the policy to anyone with
  the sign-in page open. Strength is enforced where passwords are set, not used.
*/
export const SignInSchema = z.object({
  identifier: z.string().trim().min(1, encodeZodMessage(USERS.EMAIL_REQUIRED.CODE, 'Enter your login ID or email address.')),
  password: z.string().min(1, encodeZodMessage(USERS.PASSWORD_TOO_SHORT.CODE, 'Password is required.')),
});

export type SignInInput = z.input<typeof SignInSchema>;
export type SignInOutput = z.output<typeof SignInSchema>;
