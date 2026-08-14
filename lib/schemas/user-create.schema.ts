import { z } from 'zod';

import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';

import { encodeZodMessage } from '@/lib/utils';

import { userFields } from './user-fields.schema';

const USERS = CODES.VALIDATION.USERS;

/*
  An administrator must have a department; every other role's is optional. It is a
  refinement rather than a required field because the requirement depends on the sibling
  `role` - and it fires client-side so the box shows an inline error, not a server round-trip.
*/
export function requireDepartmentForAdmin(values: { role: string; department?: string }, ctx: z.RefinementCtx): void {
  if (values.role === USER_ROLES.ADMIN && !values.department?.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['department'],
      message: encodeZodMessage(USERS.DEPARTMENT_REQUIRED.CODE, USERS.DEPARTMENT_REQUIRED.MESSAGE),
    });
  }
}

/*
  An administrator creates every account — there is no public sign-up — so the role
  is chosen here rather than defaulting. Optional text fields accept an empty string
  because that is what an untouched form input actually submits.
*/
export const UserCreateSchema = z
  .object({
    name: userFields.name,
    email: userFields.email,
    password: userFields.password,
    role: userFields.role,
    designation: userFields.designation.optional().or(z.literal('')),
    roll: userFields.roll.optional().or(z.literal('')),
    registrationNo: userFields.registrationNo.optional().or(z.literal('')),
    session: userFields.session.optional().or(z.literal('')),
    department: userFields.department.optional().or(z.literal('')),
    semester: userFields.semester.optional(),
    phone: userFields.phone.optional().or(z.literal('')),
  })
  .superRefine(requireDepartmentForAdmin);

export type UserCreateInput = z.input<typeof UserCreateSchema>;
export type UserCreateOutput = z.output<typeof UserCreateSchema>;
