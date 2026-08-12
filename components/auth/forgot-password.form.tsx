'use client';

import { useState } from 'react';

import { MailCheck } from 'lucide-react';

import { isSuccess } from '@/lib/result';
import { resolveEmailRequestErrorMessage } from '@/lib/utils';
import type { EmailRequestErrorLabels } from '@/lib/utils';

import { Button, Input, Label } from '@/components/ui';

import { requestPasswordResetAction } from './registration.actions';

type ForgotPasswordLabels = {
  emailLabel: string;
  submit: string;
  submitting: string;
  sentTitle: string;
  sentDescription: string;
  errors: EmailRequestErrorLabels;
};

type ForgotPasswordFormProps = {
  labels: ForgotPasswordLabels;
};

/*
  Ask for a reset link. Like the resend-confirmation form it turns into a "check your inbox"
  panel once a request goes through - but it now names an unregistered address rather than
  hiding it, the department's deliberate choice, so a not-registered failure is shown here
  the same way sign-in shows a bad password.
*/
export function ForgotPasswordForm({ labels }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFormError(null);
    setIsSending(true);

    const result = await requestPasswordResetAction(email);

    setIsSending(false);

    if (isSuccess(result)) {
      setIsSent(true);

      return;
    }

    setFormError(resolveEmailRequestErrorMessage(result.errors[0]?.code ?? 0, labels.errors));
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setEmail(event.target.value);
  };

  if (isSent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <MailCheck className="text-primary size-10" aria-hidden />
        <h2 className="text-xl">{labels.sentTitle}</h2>
        <p className="text-muted-foreground text-sm">{labels.sentDescription}</p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {formError && (
        <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="forgot-email">{labels.emailLabel}</Label>
        <Input id="forgot-email" type="email" autoComplete="email" value={email} onChange={handleEmailChange} />
      </div>

      <Button type="submit" variant="default" disabled={isSending || email.length === 0} className="w-full">
        {isSending ? labels.submitting : labels.submit}
      </Button>
    </form>
  );
}
