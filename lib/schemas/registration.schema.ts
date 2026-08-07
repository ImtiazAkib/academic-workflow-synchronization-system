import { z } from 'zod';

import { CODES } from '@/constants/codes.const';
import { SEMESTER } from '@/constants/schedule.const';

import { encodeZodMessage } from '@/lib/utils';

import { userFields } from './user-fields.schema';

const USERS = CODES.VALIDATION.USERS;

/*
  Registration is the first unauthenticated write in the application, so what these
  schemas leave out matters as much as what they contain.

  There is no `role` field. The role is decided by which form was posted, in the action,
  and is never read from the request body — so there is nothing for a hand-built request
  to set to `admin`. A schema that accepted a role and then checked it would be one
  refactor away from accepting the wrong one.

  There is no `loginId` either. It is issued by the server when verification passes, not
  chosen, so an applicant has nothing to claim.

  Nor `isApproved`, `isActive` or `emailVerified` — the account's state is the
  application's to decide, and an applicant who could set it would be approving
  themselves.
*/

/**
 * A required departmental field, refused when blank with its own message.
 *
 * The bare `userFields` validators only bound the length, because an administrator
 * editing an account may legitimately leave them empty. At registration they are asked
 * for, so emptiness is a separate refusal with a separate reason.
 *
 * @param field - The bounded validator to build on.
 * @param code - The refusal to raise when it is blank.
 *
 * @returns A validator that also refuses an empty value.
 */
function required(field: z.ZodString, code: { CODE: number; MESSAGE: string }) {
  return field.min(1, encodeZodMessage(code.CODE, code.MESSAGE));
}

export const StudentRegistrationSchema = z.object({
  name: userFields.name,
  email: userFields.email,
  password: userFields.password,
  roll: required(userFields.roll, USERS.ROLL_REQUIRED),
  registrationNo: required(userFields.registrationNo, USERS.REGISTRATION_NO_REQUIRED),
  session: required(userFields.session, USERS.SESSION_REQUIRED),
  department: required(userFields.department, USERS.DEPARTMENT_REQUIRED),
  /*
    Chosen by the applicant, unlike everywhere else in the app. It is unverified until
    an administrator approves the account, and the approval screen is where they correct
    it — the same moment they are already checking who the person is. Required here
    because a student who never picks one lands on "no semester assigned" and has to ask
    somebody anyway.
  */
  semester: z.coerce
    .number()
    .int()
    .min(SEMESTER.MIN, encodeZodMessage(USERS.SEMESTER_INVALID.CODE, USERS.SEMESTER_INVALID.MESSAGE))
    .max(SEMESTER.MAX, encodeZodMessage(USERS.SEMESTER_INVALID.CODE, USERS.SEMESTER_INVALID.MESSAGE)),
});

export const TeacherRegistrationSchema = z.object({
  name: userFields.name,
  email: userFields.email,
  password: userFields.password,
  department: required(userFields.department, USERS.DEPARTMENT_REQUIRED),
});

export type StudentRegistrationInput = z.input<typeof StudentRegistrationSchema>;
export type StudentRegistrationOutput = z.output<typeof StudentRegistrationSchema>;
export type TeacherRegistrationInput = z.input<typeof TeacherRegistrationSchema>;
export type TeacherRegistrationOutput = z.output<typeof TeacherRegistrationSchema>;
