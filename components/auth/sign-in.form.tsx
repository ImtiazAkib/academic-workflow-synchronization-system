'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useRouter } from '@/l10n/navigation';

import { ROLE_HOME } from '@/constants/routes.const';

import { isSuccess } from '@/lib/result';
import { SignInInput, SignInOutput, SignInSchema } from '@/lib/schemas';
import { SignInErrorLabels, resolveSignInErrorMessage } from '@/lib/utils';

import { Button, Input, Label, PasswordInput, Spinner } from '@/components/ui';

import { signInAction } from './actions';

type SignInFormLabels = {
  identifierLabel: string;
  identifierPlaceholder: string;
  identifierRequired: string;
  identifierHint: string;
  passwordLabel: string;
  passwordRequired: string;
  showPassword: string;
  hidePassword: string;
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
  /*
    `isSubmitting` goes false the moment the action resolves, but a successful sign-in then
    navigates — and react-hook-form has already re-enabled the button by the time the new
    page paints. This holds the busy state through the redirect, so the button never flicks
    back to "Sign in" for the instant before the dashboard loads. It is never cleared,
    because the only way out of a successful submit is the navigation that unmounts this.
  */
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput, undefined, SignInOutput>({
    resolver: zodResolver(SignInSchema),
  });

  const isBusy = isSubmitting || isRedirecting;

  const handleFormSubmit = async (values: SignInOutput): Promise<void> => {
    setFormError(null);

    const result = await signInAction(values);

    if (isSuccess(result) && result.result) {
      setIsRedirecting(true);

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
        <Label htmlFor="identifier">{labels.identifierLabel}</Label>
        {/*
          `type="text"`, not `email`. A student types `S-2026-0042` here, and a browser
          validating this as an email would refuse to submit the form before the server
          ever saw it. `autoComplete="username"` because that is what this now is.
        */}
        <Input
          id="identifier"
          type="text"
          autoComplete="username"
          placeholder={labels.identifierPlaceholder}
          aria-invalid={Boolean(errors.identifier)}
          {...register('identifier')}
        />
        {errors.identifier && <p className="text-destructive text-sm">{labels.identifierRequired}</p>}
        <p className="text-muted-foreground text-xs">{labels.identifierHint}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{labels.passwordLabel}</Label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          showLabel={labels.showPassword}
          hideLabel={labels.hidePassword}
          {...register('password')}
        />
        {errors.password && <p className="text-destructive text-sm">{labels.passwordRequired}</p>}
      </div>

      <Button type="submit" variant="default" disabled={isBusy} className="mt-1 w-full">
        {isBusy && <Spinner className="size-4" />}
        {isBusy ? labels.submitting : labels.submit}
      </Button>
    </form>
  );
}
