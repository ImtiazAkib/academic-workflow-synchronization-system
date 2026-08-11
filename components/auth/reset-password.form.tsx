'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Link } from '@/l10n/navigation';

import { CODES } from '@/constants/codes.const';
import { ROUTES } from '@/constants/routes.const';

import { isSuccess } from '@/lib/result';
import { PasswordResetInput, PasswordResetOutput, PasswordResetSchema } from '@/lib/schemas';
import { resolveVerificationFailure } from '@/lib/utils';
import type { VerificationErrorLabels } from '@/lib/utils';

import { Button, Label, PasswordInput } from '@/components/ui';

import { resetPasswordAction } from './registration.actions';

const VALIDATION = CODES.VALIDATION.USERS;

type ResetPasswordLabels = {
  newLabel: string;
  confirmLabel: string;
  submit: string;
  submitting: string;
  showPassword: string;
  hidePassword: string;
  successTitle: string;
  successDescription: string;
  signInCta: string;
  requestNewCta: string;
  fieldErrors: {
    passwordTooShort: string;
    passwordsDoNotMatch: string;
  };
  failures: VerificationErrorLabels;
};

type ResetPasswordFormProps = {
  token: string;
  labels: ResetPasswordLabels;
};

/*
  A form, not the auto-firing effect the email-verification screen uses. The token is spent
  by the write, so it must be spent on submit — a refresh or a link prefetch would otherwise
  burn it before the new password is even typed.

  Three end states: the form itself, a full-screen link failure (the token was invalid or
  expired — the two cases typing again cannot fix, which send the visitor back to ask for a
  fresh link), and a success with the way on to sign-in.
*/
export function ResetPasswordForm({ token, labels }: ResetPasswordFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ title: string; description: string } | null>(null);
  const [isDone, setIsDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetInput, undefined, PasswordResetOutput>({
    resolver: zodResolver(PasswordResetSchema),
    defaultValues: { token, password: '', confirmPassword: '' },
  });

  const handleFormSubmit = async (values: PasswordResetOutput): Promise<void> => {
    setFormError(null);

    const result = await resetPasswordAction(values);

    if (isSuccess(result)) {
      setIsDone(true);

      return;
    }

    const code = result.errors[0]?.code ?? 0;

    /*
      An invalid or expired link is not something resubmitting fixes, so it earns the full
      failure screen — the same two cases the confirmation link has. Anything else is a
      transient fault worth a line above the still-usable form.
    */
    if (code === VALIDATION.VERIFICATION_LINK_INVALID.CODE || code === VALIDATION.VERIFICATION_LINK_EXPIRED.CODE) {
      setFailure(resolveVerificationFailure(code, labels.failures));

      return;
    }

    setFormError(labels.failures.invalidDescription);
  };

  if (failure) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <XCircle className="text-destructive size-10" aria-hidden />
        <h1 className="text-2xl">{failure.title}</h1>
        <p className="text-muted-foreground text-sm">{failure.description}</p>

        <Button variant="appPrimary" nativeButton={false} render={<Link href={ROUTES.FORGOT_PASSWORD.HREF} />}>
          {labels.requestNewCta}
        </Button>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="text-primary size-10" aria-hidden />
        <h1 className="text-2xl">{labels.successTitle}</h1>
        <p className="text-muted-foreground text-sm">{labels.successDescription}</p>

        <Button variant="appPrimary" nativeButton={false} render={<Link href={ROUTES.SIGN_IN.HREF} />}>
          {labels.signInCta}
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
      {formError && (
        <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {formError}
        </p>
      )}

      <input type="hidden" {...register('token')} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-password">{labels.newLabel}</Label>
        <PasswordInput
          id="reset-password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          showLabel={labels.showPassword}
          hideLabel={labels.hidePassword}
          {...register('password')}
        />
        {errors.password && <p className="text-destructive text-sm">{labels.fieldErrors.passwordTooShort}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-confirm">{labels.confirmLabel}</Label>
        <PasswordInput
          id="reset-confirm"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          showLabel={labels.showPassword}
          hideLabel={labels.hidePassword}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && <p className="text-destructive text-sm">{labels.fieldErrors.passwordsDoNotMatch}</p>}
      </div>

      <Button type="submit" variant="appPrimary" disabled={isSubmitting} className="w-full">
        {isSubmitting ? labels.submitting : labels.submit}
      </Button>
    </form>
  );
}
