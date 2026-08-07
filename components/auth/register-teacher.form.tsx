'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useRouter } from '@/l10n/navigation';

import { ROUTES } from '@/constants/routes.const';

import { isSuccess } from '@/lib/result';
import { TeacherRegistrationInput, TeacherRegistrationOutput, TeacherRegistrationSchema } from '@/lib/schemas';
import { resolveRegistrationErrorMessage } from '@/lib/utils';

import { Button, Input, Label } from '@/components/ui';

import { registerTeacherAction } from './registration.actions';

import type { RegisterFormLabels } from './register.types';

type RegisterTeacherFormProps = {
  labels: RegisterFormLabels;
};

/*
  Four fields. A teacher is identified by the department rather than by a roll and a
  session, so this asks for less than the student form and shares nothing with it beyond
  the label bundle — two forms that differ by which inputs they render are clearer than
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
    formState: { errors, isSubmitting },
  } = useForm<TeacherRegistrationInput, undefined, TeacherRegistrationOutput>({
    resolver: zodResolver(TeacherRegistrationSchema),
    defaultValues: { name: '', email: '', password: '', department: '' },
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
        <Input id="register-department" aria-invalid={Boolean(errors.department)} {...register('department')} />
        {errors.department && <p className="text-destructive text-sm">{labels.fieldErrors.required}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="register-password">{labels.password}</Label>
        <Input id="register-password" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...register('password')} />
        {errors.password && <p className="text-destructive text-sm">{labels.fieldErrors.passwordTooShort}</p>}
      </div>

      <Button type="submit" variant="appPrimary" disabled={isSubmitting} className="mt-1 w-full">
        {isSubmitting ? labels.submitting : labels.submit}
      </Button>
    </form>
  );
}
