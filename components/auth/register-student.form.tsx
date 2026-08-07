'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { useRouter } from '@/l10n/navigation';

import { ROUTES } from '@/constants/routes.const';
import { SEMESTER } from '@/constants/schedule.const';

import { isSuccess } from '@/lib/result';
import { StudentRegistrationInput, StudentRegistrationOutput, StudentRegistrationSchema } from '@/lib/schemas';
import { resolveRegistrationErrorMessage, resolveSemesterLabel } from '@/lib/utils';

import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';

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
          <Input id="register-roll" aria-invalid={Boolean(errors.roll)} {...register('roll')} />
          {errors.roll && <p className="text-destructive text-sm">{labels.fieldErrors.required}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="register-registration-no">{labels.registrationNo}</Label>
          <Input id="register-registration-no" aria-invalid={Boolean(errors.registrationNo)} {...register('registrationNo')} />
          {errors.registrationNo && <p className="text-destructive text-sm">{labels.fieldErrors.required}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="register-session">{labels.session}</Label>
          <Input id="register-session" placeholder={labels.sessionPlaceholder} aria-invalid={Boolean(errors.session)} {...register('session')} />
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
          <Input id="register-department" aria-invalid={Boolean(errors.department)} {...register('department')} />
          {errors.department && <p className="text-destructive text-sm">{labels.fieldErrors.required}</p>}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="register-password">{labels.password}</Label>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
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
