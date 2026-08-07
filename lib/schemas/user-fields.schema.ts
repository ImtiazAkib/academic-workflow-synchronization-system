import { z } from 'zod';

import { ACCOUNT_FIELD_LIMITS } from '@/constants/account.const';
import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';
import { SEMESTER } from '@/constants/schedule.const';

import { encodeZodMessage } from '@/lib/utils';

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

  roll: z.string().trim().max(ACCOUNT_FIELD_LIMITS.ROLL, encodeZodMessage(USERS.ROLL_TOO_LONG.CODE, USERS.ROLL_TOO_LONG.MESSAGE)),

  /*
    The departmental fields registration collects. Bounded rather than patterned: a roll
    number, a registration number and a session are written differently by different
    departments, and a format nobody agreed on would reject legitimate applicants at the
    one moment they cannot ask anybody for help. An administrator corrects them at
    approval, which is the same moment they are already checking who the person is.
  */
  registrationNo: z
    .string()
    .trim()
    .max(ACCOUNT_FIELD_LIMITS.REGISTRATION_NO, encodeZodMessage(USERS.REGISTRATION_NO_TOO_LONG.CODE, USERS.REGISTRATION_NO_TOO_LONG.MESSAGE)),

  session: z.string().trim().max(ACCOUNT_FIELD_LIMITS.SESSION, encodeZodMessage(USERS.SESSION_TOO_LONG.CODE, USERS.SESSION_TOO_LONG.MESSAGE)),

  department: z
    .string()
    .trim()
    .max(ACCOUNT_FIELD_LIMITS.DEPARTMENT, encodeZodMessage(USERS.DEPARTMENT_TOO_LONG.CODE, USERS.DEPARTMENT_TOO_LONG.MESSAGE)),

  address: z.string().trim().max(ACCOUNT_FIELD_LIMITS.ADDRESS, encodeZodMessage(USERS.ADDRESS_TOO_LONG.CODE, USERS.ADDRESS_TOO_LONG.MESSAGE)),

  /*
    Arrives as a string because it comes from a `<Select>`, and leaves as a number or
    nothing at all. The empty string is the untouched value, not a zero — an account
    with no semester is the normal state for an administrator and a teacher, and for a
    student whose year has not been set yet.

    The composing schemas add `.optional()` but not `.or(z.literal(''))`, unlike every
    other optional field here: the emptiness and the range are one question, so the
    answer is one error rather than a union that reports two — and the output is
    `number | undefined` rather than `number | '' | undefined`, which is what keeps the
    service from having to re-ask whether a blank string means anything.

    **It accepts a number as well as a string, and that is load-bearing.** This is the
    only field in the app whose parsed output has a different type from its input, and
    the value is parsed twice: `zodResolver` transforms it in the browser, then the
    Server Action re-validates the values the form hands it — because an action is a
    public endpoint and cannot trust its caller. A string-only schema would reject its
    own output on that second pass, and every attempt to save a student with a semester
    would fail. Parsing has to be idempotent here; `scripts/verify-student.ts` asserts
    the round trip so it stays that way.
  */
  semester: z
    .union([z.number(), z.string().trim()])
    .transform(value => (value === '' ? undefined : Number(value)))
    .refine(value => value === undefined || (Number.isInteger(value) && value >= SEMESTER.MIN && value <= SEMESTER.MAX), {
      message: encodeZodMessage(USERS.SEMESTER_INVALID.CODE, USERS.SEMESTER_INVALID.MESSAGE),
    }),

  phone: z.string().trim().max(40, encodeZodMessage(USERS.PHONE_TOO_LONG.CODE, USERS.PHONE_TOO_LONG.MESSAGE)),
};
