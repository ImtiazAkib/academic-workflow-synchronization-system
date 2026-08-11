import { z } from 'zod';

import { ACCOUNT_FIELD_LIMITS, BANGLADESH_PHONE_STORED_PATTERN } from '@/constants/account.const';
import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';
import { SEMESTER } from '@/constants/schedule.const';

import { encodeZodMessage, normalizeBangladeshPhone } from '@/lib/utils';

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

  /*
    A roll number and a registration number are numbers the department issues, so they are
    digits and nothing else — the regex refuses letters and dashes. The length bound stays
    as a backstop against an absurd run of digits. Empty is not this field's problem: the
    composing schemas add `.min(1)` where the value is required and `.or(z.literal(''))`
    where it is optional, so a blank box is answered there rather than by the digit rule.
  */
  roll: z
    .string()
    .trim()
    .max(ACCOUNT_FIELD_LIMITS.ROLL, encodeZodMessage(USERS.ROLL_TOO_LONG.CODE, USERS.ROLL_TOO_LONG.MESSAGE))
    .regex(/^\d*$/, encodeZodMessage(USERS.ROLL_DIGITS_ONLY.CODE, USERS.ROLL_DIGITS_ONLY.MESSAGE)),

  registrationNo: z
    .string()
    .trim()
    .max(ACCOUNT_FIELD_LIMITS.REGISTRATION_NO, encodeZodMessage(USERS.REGISTRATION_NO_TOO_LONG.CODE, USERS.REGISTRATION_NO_TOO_LONG.MESSAGE))
    .regex(/^\d*$/, encodeZodMessage(USERS.REGISTRATION_NO_DIGITS_ONLY.CODE, USERS.REGISTRATION_NO_DIGITS_ONLY.MESSAGE)),

  /*
    Chosen from a dropdown the client builds from `buildSessionValues`, so the stored value
    is always one of `2020-21 … <this year>`. Kept as a bounded string rather than an enum
    of those values because the list is a moving target — it grows by one each year — and a
    schema that hard-coded this year's list would reject next year's students.
  */
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

  /*
    A Bangladesh mobile number, one department in one country. `normalizeBangladeshPhone`
    maps whatever is typed — the ten local digits the `+880` field takes, `01XXXXXXXXX`, or
    the already-international form — onto the single stored shape, then the pattern checks
    it. The transform is idempotent (its own output normalizes to itself), which is what
    lets the Server Action re-validate the value the browser already normalized without it
    failing on the second pass — the same property `semester` depends on.

    An empty string stays empty rather than becoming a number-shaped error: the field is
    optional in every schema that composes it.
  */
  phone: z
    .string()
    .trim()
    .transform(value => normalizeBangladeshPhone(value))
    .refine(
      value => value === '' || BANGLADESH_PHONE_STORED_PATTERN.test(value),
      encodeZodMessage(USERS.PHONE_INVALID.CODE, USERS.PHONE_INVALID.MESSAGE)
    ),
};
