'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { useRouter } from '@/l10n/navigation';

import { DEPARTMENTS, DEPARTMENT_LABELS } from '@/constants/account.const';
import { ROUTES } from '@/constants/routes.const';

import { isSuccess } from '@/lib/result';
import { TeacherRegistrationInput, TeacherRegistrationOutput, TeacherRegistrationSchema } from '@/lib/schemas';
import { resolveRegistrationErrorMessage } from '@/lib/utils';

import { Button, Input, Label, PasswordInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';

import { registerTeacherAction } from './registration.actions';

import type { RegisterFormLabels } from './register.types';

type RegisterTeacherFormProps = {
  labels: RegisterFormLabels;
};

/*
  Four fields. A teacher is identified by the department rather than by a roll and a
  session, so this asks for less than the student form and shares nothing with it beyond
  the label bundle - two forms that differ by which inputs they render are clearer than
  one form full of conditionals.

  There is no role input. Which action runs decides the role, so there is nothing here
  for a hand-built request to change.
*/
export function RegisterTeacherForm({ labels }: RegisterTeacherFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TeacherRegistrationInput, undefined, TeacherRegistrationOutput>({
    resolver: zodResolver(TeacherRegistrationSchema),
    defaultValues: { name: '', email: '', password: '', department: '' },
  });

  // The stored value stays the department code; the option shows its full name.
  const departmentItems: Record<string, string> = {};

  DEPARTMENTS.forEach(department => {
    departmentItems[department] = DEPARTMENT_LABELS[department];
  });

  const handleFormSubmit = async (values: TeacherRegistrationOutput): Promise<void> => {
    setFormError(null);

    const result = await registerTeacherAction(values);

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

      <div className="flex flex-col gap-2">
        <Label htmlFor="register-name">{labels.name}</Label>
        <Input id="register-name" autoComplete="name" aria-invalid={Boolean(errors.name)} {...register('name')} />
        {errors.name && <p className="text-destructive text-sm">{labels.fieldErrors.nameRequired}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="register-email">{labels.email}</Label>
        <Input id="register-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
        {errors.email && <p className="text-destructive text-sm">{labels.fieldErrors.emailInvalid}</p>}
      </div>

      <div className="flex flex-col gap-2">
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

      <div className="flex flex-col gap-2">
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

      <Button type="submit" variant="default" disabled={isSubmitting} className="mt-1 w-full">
        {isSubmitting ? labels.submitting : labels.submit}
      </Button>
    </form>
  );
}
