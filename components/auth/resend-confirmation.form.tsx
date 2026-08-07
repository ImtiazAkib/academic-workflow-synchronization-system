'use client';

import { useState } from 'react';

import { MailCheck } from 'lucide-react';

import { Button, Input, Label } from '@/components/ui';

import { resendVerificationAction } from './registration.actions';

type ResendConfirmationLabels = {
  emailLabel: string;
  submit: string;
  submitting: string;
  sentTitle: string;
  sentDescription: string;
};

type ResendConfirmationFormProps = {
  labels: ResendConfirmationLabels;
};

/*
  Deliberately says the same thing whatever happened. A form that reported "no account
  with that address" would be a way for anybody to test which addresses are registered
  here — which is precisely what sign-in refuses to disclose, so disclosing it one screen
  over would be pointless.

  There is no field-level validation either. A malformed address simply produces the same
  confirmation, because telling somebody their typo was rejected is not worth a second
  code path that behaves differently for known and unknown input.
*/
export function ResendConfirmationForm({ labels }: ResendConfirmationFormProps) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSending(true);

    await resendVerificationAction(email);

    setIsSending(false);
    setIsSent(true);
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="resend-email">{labels.emailLabel}</Label>
        <Input id="resend-email" type="email" autoComplete="email" value={email} onChange={handleEmailChange} />
      </div>

      <Button type="submit" variant="appPrimary" disabled={isSending || email.length === 0} className="w-full">
        {isSending ? labels.submitting : labels.submit}
      </Button>
    </form>
  );
}
