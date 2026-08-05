'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useRouter } from '@/l10n/navigation';

import { ROLE_HOME } from '@/constants/routes.const';

import { isSuccess } from '@/lib/result';
import { SignInInput, SignInOutput, SignInSchema } from '@/lib/schemas';
import { SignInErrorLabels, resolveSignInErrorMessage } from '@/lib/utils';

import { Button, Input, Label } from '@/components/ui';

import { signInAction } from './actions';

type SignInFormLabels = {
  emailLabel: string;
  emailPlaceholder: string;
  emailInvalid: string;
  passwordLabel: string;
  passwordRequired: string;
  submit: string;
  submitting: string;
  errors: SignInErrorLabels;
};

type SignInFormProps = {
  labels: SignInFormLabels;
};

export function SignInForm({ labels }: SignInFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput, undefined, SignInOutput>({
    resolver: zodResolver(SignInSchema),
  });

  const handleFormSubmit = async (values: SignInOutput): Promise<void> => {
    setFormError(null);

    const result = await signInAction(values);

    if (isSuccess(result) && result.result) {
      // Each role lands in its own area; `refresh()` re-renders the server tree so
      // the new session is picked up.
      router.replace(ROLE_HOME[result.result]);
      router.refresh();

      return;
    }

    setFormError(resolveSignInErrorMessage(result.errors[0]?.code ?? 0, labels.errors));
  };

  return (
    <form noValidate onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
      {formError && (
        <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{labels.emailLabel}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={labels.emailPlaceholder}
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email && <p className="text-destructive text-sm">{labels.emailInvalid}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{labels.passwordLabel}</Label>
        <Input id="password" type="password" autoComplete="current-password" aria-invalid={Boolean(errors.password)} {...register('password')} />
        {errors.password && <p className="text-destructive text-sm">{labels.passwordRequired}</p>}
      </div>

      <Button type="submit" variant="appPrimary" disabled={isSubmitting} className="mt-1 w-full">
        {isSubmitting ? labels.submitting : labels.submit}
      </Button>
    </form>
  );
}
