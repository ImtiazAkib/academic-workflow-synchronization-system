import { z } from 'zod';

import { EMAIL_VERIFICATION } from '@/constants/account.const';
import { CODES } from '@/constants/codes.const';

import { encodeZodMessage } from '@/lib/utils';

const USERS = CODES.VALIDATION.USERS;

/*
  The shape `randomBytes(TOKEN_BYTES).toString('hex')` produces, and nothing else.

  Both confirmation screens used to coerce whatever arrived into a string and hand it
  onward, so a junk token became an empty one, was hashed, and cost a database lookup
  before being refused for not matching anything. Refusing it here is the same answer one
  round trip earlier — and the message is deliberately the invalid-link one, because to
  the person holding the link that is exactly what it is.

  The length is derived rather than written down: hex is two characters per byte, so this
  cannot drift if the token ever gets longer.
*/
export const VerificationTokenSchema = z
  .string()
  .trim()
  .length(EMAIL_VERIFICATION.TOKEN_BYTES * 2, encodeZodMessage(USERS.VERIFICATION_LINK_INVALID.CODE, USERS.VERIFICATION_LINK_INVALID.MESSAGE))
  .regex(/^[a-f\d]+$/i, encodeZodMessage(USERS.VERIFICATION_LINK_INVALID.CODE, USERS.VERIFICATION_LINK_INVALID.MESSAGE));

export type VerificationTokenInput = z.input<typeof VerificationTokenSchema>;
export type VerificationTokenOutput = z.output<typeof VerificationTokenSchema>;
