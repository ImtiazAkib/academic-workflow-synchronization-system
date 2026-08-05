import { z } from 'zod';

import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';

import { encodeZodMessage } from '@/lib/zod.utils';

const USERS = CODES.VALIDATION.USERS;

/*
  Messages carry their error code, encoded into the string, because Zod issues have
  nowhere else to put one. `mapZodErrorsToErrorDto()` unpacks them back into
  `{ code, error, field }` on the way out.

  Only the user schemas carry codes today: they are the first ones consumed by a
  service, in the authentication step. The other entities get theirs when the
  services that raise them land.
*/
export const userFields = {
  name: z
    .string()
    .trim()
    .min(1, encodeZodMessage(USERS.NAME_REQUIRED.CODE, USERS.NAME_REQUIRED.MESSAGE))
    .max(120, encodeZodMessage(USERS.NAME_TOO_LONG.CODE, USERS.NAME_TOO_LONG.MESSAGE)),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, encodeZodMessage(USERS.EMAIL_REQUIRED.CODE, USERS.EMAIL_REQUIRED.MESSAGE))
    .pipe(z.email(encodeZodMessage(USERS.EMAIL_INVALID.CODE, USERS.EMAIL_INVALID.MESSAGE))),

  password: z
    .string()
    .min(8, encodeZodMessage(USERS.PASSWORD_TOO_SHORT.CODE, USERS.PASSWORD_TOO_SHORT.MESSAGE))
    .max(128, encodeZodMessage(USERS.PASSWORD_TOO_LONG.CODE, USERS.PASSWORD_TOO_LONG.MESSAGE)),

  role: z.enum(Object.values(USER_ROLES), encodeZodMessage(USERS.ROLE_INVALID.CODE, USERS.ROLE_INVALID.MESSAGE)),

  designation: z.string().trim().max(120, encodeZodMessage(USERS.DESIGNATION_TOO_LONG.CODE, USERS.DESIGNATION_TOO_LONG.MESSAGE)),

  studentId: z.string().trim().max(40, encodeZodMessage(USERS.STUDENT_ID_TOO_LONG.CODE, USERS.STUDENT_ID_TOO_LONG.MESSAGE)),

  phone: z.string().trim().max(40, encodeZodMessage(USERS.PHONE_TOO_LONG.CODE, USERS.PHONE_TOO_LONG.MESSAGE)),
};
