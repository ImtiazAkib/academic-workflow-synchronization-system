'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { useRouter } from '@/l10n/navigation';

import { DEPARTMENTS, DEPARTMENT_LABELS } from '@/constants/account.const';
import { ROUTES } from '@/constants/routes.const';
import { SEMESTER } from '@/constants/schedule.const';

import { isSuccess } from '@/lib/result';
import { StudentRegistrationInput, StudentRegistrationOutput, StudentRegistrationSchema } from '@/lib/schemas';
import { buildSessionValues, resolveRegistrationErrorMessage, resolveSemesterLabel } from '@/lib/utils';

import { Button, Input, Label, PasswordInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';

import { registerStudentAction } from './registration.actions';

import type { RegisterFormLabels } from './register.types';

type RegisterStudentFormProps = {
  labels: RegisterFormLabels;
};

/*
  The semester is the one field here an applicant declares about themselves that the
  application later acts on — it decides which timetable and which files they see. It is
  unverified until an administrator approves the account, and the approval screen is
  where they correct it, which is the same moment they are already checking who the
  person is.

  There is no role input. Which action runs decides the role, so there is nothing here
  for a hand-built request to change.
*/
export function RegisterStudentForm({ labels }: RegisterStudentFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<StudentRegistrationInput, undefined, StudentRegistrationOutput>({
    resolver: zodResolver(StudentRegistrationSchema),
    defaultValues: { name: '', email: '', password: '', roll: '', registrationNo: '', session: '', department: '', semester: '' },
  });

  const semesterItems: Record<string, string> = {};

  for (let semester = SEMESTER.MIN; semester <= SEMESTER.MAX; semester++) {
    semesterItems[String(semester)] = resolveSemesterLabel(semester);
  }

  // The stored value stays the department code; the option shows its full name.
  const departmentItems: Record<string, string> = {};

  DEPARTMENTS.forEach(department => {
    departmentItems[department] = DEPARTMENT_LABELS[department];
  });

  // 2020-21 up to this year, newest first. Required at registration, so no blank entry.
  const sessionItems: Record<string, string> = {};

  buildSessionValues().forEach(session => {
    sessionItems[session] = session;
  });

  const handleFormSubmit = async (values: StudentRegistrationOutput): Promise<void> => {
    setFormError(null);

    const result = await registerStudentAction(values);

    if (isSuccess(result)) {
      router.replace(ROUTES.REGISTRATION_RECEIVED.HREF);

      return;
    }

    setFormError(resolveRegistrationErrorMessage(result.errors[0]?.code ?? 0, labels.errors));
  };

  return (
    <form noValidate onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
      {formError && (
        <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {formError}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="register-name">{labels.name}</Label>
          <Input id="register-name" autoComplete="name" aria-invalid={Boolean(errors.name)} {...register('name')} />
          {errors.name && <p className="text-destructive text-sm">{labels.fieldErrors.nameRequired}</p>}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="register-email">{labels.email}</Label>
          <Input id="register-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
          {errors.email && <p className="text-destructive text-sm">{labels.fieldErrors.emailInvalid}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="register-roll">{labels.roll}</Label>
          <Input id="register-roll" inputMode="numeric" aria-invalid={Boolean(errors.roll)} {...register('roll')} />
          {errors.roll && (
            <p className="text-destructive text-sm">
              {errors.roll.type === 'too_small' ? labels.fieldErrors.required : labels.fieldErrors.digitsOnly}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="register-registration-no">{labels.registrationNo}</Label>
          <Input id="register-registration-no" inputMode="numeric" aria-invalid={Boolean(errors.registrationNo)} {...register('registrationNo')} />
          {errors.registrationNo && (
            <p className="text-destructive text-sm">
              {errors.registrationNo.type === 'too_small' ? labels.fieldErrors.required : labels.fieldErrors.digitsOnly}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="register-session">{labels.session}</Label>
          <Controller
            control={control}
            name="session"
            render={({ field }) => (
              <Select items={sessionItems} value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger id="register-session" className="w-full">
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
          {errors.session && <p className="text-destructive text-sm">{labels.fieldErrors.required}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="register-semester">{labels.semester}</Label>
          <Controller
            control={control}
            name="semester"
            render={({ field }) => (
              <Select items={semesterItems} value={String(field.value ?? '')} onValueChange={field.onChange}>
                <SelectTrigger id="register-semester" className="w-full">
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
          {errors.semester && <p className="text-destructive text-sm">{labels.fieldErrors.required}</p>}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="register-department">{labels.department}</Label>
          <Controller
            control={control}
            name="department"
            render={({ field }) => (
              <Select items={departmentItems} value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger id="register-department" className="w-full">
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
          {errors.department && <p className="text-destructive text-sm">{labels.fieldErrors.required}</p>}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="register-password">{labels.password}</Label>
          <PasswordInput
            id="register-password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            showLabel={labels.showPassword}
            hideLabel={labels.hidePassword}
            {...register('password')}
          />
          {errors.password && <p className="text-destructive text-sm">{labels.fieldErrors.passwordTooShort}</p>}
        </div>
      </div>

      <Button type="submit" variant="appPrimary" disabled={isSubmitting} className="mt-1 w-full">
        {isSubmitting ? labels.submitting : labels.submit}
      </Button>
    </form>
  );
}
