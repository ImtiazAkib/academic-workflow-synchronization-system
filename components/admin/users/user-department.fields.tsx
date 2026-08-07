'use client';

import { useWatch, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';

import { USER_ROLES } from '@/constants/roles.const';

import { Input, Label } from '@/components/ui';

import type { UsersFieldErrorLabels, UsersFieldLabels } from './users.types';

/*
  Typed loosely against the form for the same reason `UserSemesterField` is: the create
  and update schemas differ by `userId` alone, and a generic would buy nothing at two
  call sites.
*/
type UserDepartmentFieldsProps = {
  register: UseFormRegister<never>;
  control: Control<never>;
  errors: FieldErrors;
  labels: UsersFieldLabels;
  fieldErrors: UsersFieldErrorLabels;
  idPrefix: string;
};

/*
  The fields registration collects that an administrator may need to correct — a roll
  number typed wrong, a session in the department's other format. They are shown here
  rather than left read-only because approval is exactly the moment somebody is checking
  who the applicant is, and a value they cannot fix is a value they have to write down
  and chase.

  Department is asked of students and teachers alike; registration number and session are
  a student's. An administrator's account has none of them, so the whole block is absent
  for that role rather than showing three inputs that mean nothing.

  Shared by the create page and the edit dialog, so the two cannot drift.
*/
export function UserDepartmentFields({ register, control, errors, labels, fieldErrors, idPrefix }: UserDepartmentFieldsProps) {
  const role = useWatch({ control, name: 'role' as never });

  if (role !== USER_ROLES.STUDENT && role !== USER_ROLES.TEACHER) {
    return null;
  }

  const isStudent = role === USER_ROLES.STUDENT;

  return (
    <>
      {isStudent && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-registration-no`}>
            {labels.registrationNo} <span className="text-muted-foreground text-xs">({labels.optional})</span>
          </Label>
          <Input id={`${idPrefix}-registration-no`} aria-invalid={Boolean(errors.registrationNo)} {...register('registrationNo' as never)} />
          {errors.registrationNo && <p className="text-destructive text-sm">{fieldErrors.registrationNoTooLong}</p>}
        </div>
      )}

      {isStudent && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-session`}>
            {labels.session} <span className="text-muted-foreground text-xs">({labels.optional})</span>
          </Label>
          <Input id={`${idPrefix}-session`} aria-invalid={Boolean(errors.session)} {...register('session' as never)} />
          {errors.session && <p className="text-destructive text-sm">{fieldErrors.sessionTooLong}</p>}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-department`}>
          {labels.department} <span className="text-muted-foreground text-xs">({labels.optional})</span>
        </Label>
        <Input id={`${idPrefix}-department`} aria-invalid={Boolean(errors.department)} {...register('department' as never)} />
        {errors.department && <p className="text-destructive text-sm">{fieldErrors.departmentTooLong}</p>}
      </div>
    </>
  );
}
