'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useRouter } from '@/l10n/navigation';

import { CODES } from '@/constants/codes.const';
import { ROUTES } from '@/constants/routes.const';

import { isSuccess } from '@/lib/result';
import { SignInInput, SignInOutput, SignInSchema } from '@/lib/schemas';

import { Button, Input, Label } from '@/components/ui';

import { signInAction } from './actions';

const AUTH = CODES.AUTH.USERS;

type SignInFormLabels = {
  emailLabel: string;
  emailPlaceholder: string;
  emailInvalid: string;
  passwordLabel: string;
  passwordRequired: string;
  submit: string;
  submitting: string;
  errorInvalidCredentials: string;
  errorNotApproved: string;
  errorDeactivated: string;
  errorUnexpected: string;
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

  /*
    The action returns a code, not a sentence — the sentence has to be the translated
    one, and only the client has the translations for this form.
  */
  const messageForCode = (code: number): string => {
    if (code === AUTH.INVALID_CREDENTIALS.CODE) {
      return labels.errorInvalidCredentials;
    }

    if (code === AUTH.ACCOUNT_NOT_APPROVED.CODE) {
      return labels.errorNotApproved;
    }

    if (code === AUTH.ACCOUNT_DEACTIVATED.CODE) {
      return labels.errorDeactivated;
    }

    return labels.errorUnexpected;
  };

  const handleFormSubmit = async (values: SignInOutput): Promise<void> => {
    setFormError(null);

    const result = await signInAction(values);

    if (isSuccess(result)) {
      // `refresh()` re-renders the server tree so the new session is picked up.
      router.replace(ROUTES.HOME.HREF);
      router.refresh();

      return;
    }

    setFormError(messageForCode(result.errors[0]?.code ?? AUTH.SIGN_IN_FAILED.CODE));
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

      <Button type="submit" variant="appPrimary" size="lg" disabled={isSubmitting} className="mt-1 w-full">
        {isSubmitting ? labels.submitting : labels.submit}
      </Button>
    </form>
  );
}
