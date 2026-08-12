'use client';

import { Controller, useWatch, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';

import { DEPARTMENTS, DEPARTMENT_LABELS } from '@/constants/account.const';
import { USER_ROLES } from '@/constants/roles.const';

import { buildSessionValues } from '@/lib/utils';

import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';

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
  The fields registration collects that an administrator may need to correct - a roll
  number typed wrong, a session in the department's other format. They are shown here
  rather than left read-only because approval is exactly the moment somebody is checking
  who the applicant is, and a value they cannot fix is a value they have to write down
  and chase.

  Roll, registration number and session are a student's; department is asked of students
  and teachers alike. An administrator's account has none of them - it signs in by email
  and belongs to no cohort - so the whole block is absent for that role rather than showing
  inputs that mean nothing. Roll lives here for the same reason: it identifies a student,
  and an administrator or a teacher has no roll to show.

  Shared by the create page and the edit dialog, so the two cannot drift.
*/
export function UserDepartmentFields({ register, control, errors, labels, fieldErrors, idPrefix }: UserDepartmentFieldsProps) {
  const role = useWatch({ control, name: 'role' as never });

  if (role !== USER_ROLES.STUDENT && role !== USER_ROLES.TEACHER) {
    return null;
  }

  const isStudent = role === USER_ROLES.STUDENT;

  // The stored value stays the department code; the option shows its full name.
  const departmentItems: Record<string, string> = {};

  DEPARTMENTS.forEach(department => {
    departmentItems[department] = DEPARTMENT_LABELS[department];
  });

  // 2020-21 up to this year, newest first, with a blank entry for "not set yet".
  const sessionItems: Record<string, string> = { '': labels.sessionUnset };

  buildSessionValues().forEach(session => {
    sessionItems[session] = session;
  });

  return (
    <>
      {isStudent && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-roll`}>
            {labels.roll} <span className="text-muted-foreground text-xs">({labels.optional})</span>
          </Label>
          <Input id={`${idPrefix}-roll`} inputMode="numeric" aria-invalid={Boolean(errors.roll)} {...register('roll' as never)} />
          {errors.roll && (
            <p className="text-destructive text-sm">{errors.roll.type === 'too_big' ? fieldErrors.rollTooLong : fieldErrors.rollDigitsOnly}</p>
          )}
        </div>
      )}

      {isStudent && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-registration-no`}>
            {labels.registrationNo} <span className="text-muted-foreground text-xs">({labels.optional})</span>
          </Label>
          <Input
            id={`${idPrefix}-registration-no`}
            inputMode="numeric"
            aria-invalid={Boolean(errors.registrationNo)}
            {...register('registrationNo' as never)}
          />
          {errors.registrationNo && (
            <p className="text-destructive text-sm">
              {errors.registrationNo.type === 'too_big' ? fieldErrors.registrationNoTooLong : fieldErrors.registrationNoDigitsOnly}
            </p>
          )}
        </div>
      )}

      {isStudent && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-session`}>
            {labels.session} <span className="text-muted-foreground text-xs">({labels.optional})</span>
          </Label>
          <Controller
            control={control}
            name={'session' as never}
            render={({ field }) => (
              <Select items={sessionItems} value={(field.value as string | undefined) ?? ''} onValueChange={field.onChange}>
                <SelectTrigger id={`${idPrefix}-session`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(sessionItems).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.session && <p className="text-destructive text-sm">{fieldErrors.sessionTooLong}</p>}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-department`}>
          {labels.department} <span className="text-muted-foreground text-xs">({labels.optional})</span>
        </Label>
        <Controller
          control={control}
          name={'department' as never}
          render={({ field }) => (
            <Select items={departmentItems} value={(field.value as string | undefined) ?? ''} onValueChange={field.onChange}>
              <SelectTrigger id={`${idPrefix}-department`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map(department => (
                  <SelectItem key={department} value={department}>
                    {DEPARTMENT_LABELS[department]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.department && <p className="text-destructive text-sm">{fieldErrors.departmentTooLong}</p>}
      </div>
    </>
  );
}
