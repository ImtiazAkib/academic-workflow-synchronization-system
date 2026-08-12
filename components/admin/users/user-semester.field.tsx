'use client';

import { Controller, useWatch, type Control, type FieldErrors } from 'react-hook-form';

import { USER_ROLES } from '@/constants/roles.const';
import { SEMESTER } from '@/constants/schedule.const';

import { resolveSemesterLabel } from '@/lib/utils';

import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';

import type { UsersFieldErrorLabels, UsersFieldLabels } from './users.types';

/*
  Typed loosely against the form for the same reason `CourseFields` is: the create and
  update schemas differ by `userId` alone, and a generic would buy nothing at two call
  sites.
*/
type UserSemesterFieldProps = {
  control: Control<never>;
  errors: FieldErrors;
  labels: UsersFieldLabels;
  fieldErrors: UsersFieldErrorLabels;
  idPrefix: string;
};

/*
  The one user field shared between the create page and the edit dialog, and the one
  that appears only for a role. A designation on a student or a phone number on an
  administrator is merely unused; a semester on a teacher is a claim about the model
  that is not true - nothing filters by it and nothing would ever show it again.

  Hiding it is agreement, not enforcement: `UserService.semesterFor()` drops the value
  for the other two roles whatever the form submits, so a hand-built request cannot
  leave a year on a teacher either.

  Watched rather than read once, because the role select sits directly above it and the
  field has to appear the moment the answer changes.
*/
export function UserSemesterField({ control, errors, labels, fieldErrors, idPrefix }: UserSemesterFieldProps) {
  const role = useWatch({ control, name: 'role' as never });

  if (role !== USER_ROLES.STUDENT) {
    return null;
  }

  // The blank entry is what "not set yet" looks like - an admin may not know the year.
  const semesterItems: Record<string, string> = { '': labels.semesterUnset };

  for (let semester = SEMESTER.MIN; semester <= SEMESTER.MAX; semester++) {
    semesterItems[String(semester)] = resolveSemesterLabel(semester);
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`${idPrefix}-semester`}>
        {labels.semester} <span className="text-muted-foreground text-xs">({labels.optional})</span>
      </Label>

      <Controller
        control={control}
        name={'semester' as never}
        render={({ field }) => (
          <Select items={semesterItems} value={String(field.value ?? '')} onValueChange={field.onChange}>
            <SelectTrigger id={`${idPrefix}-semester`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(semesterItems).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      {errors.semester && <p className="text-destructive text-sm">{fieldErrors.semesterInvalid}</p>}
    </div>
  );
}
