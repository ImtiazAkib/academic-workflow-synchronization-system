'use client';

import { useEffect, useRef, useState } from 'react';

import { CheckCircle2, XCircle } from 'lucide-react';

import { Link } from '@/l10n/navigation';

import { ROUTES } from '@/constants/routes.const';

import { isSuccess } from '@/lib/result';
import { resolveEmailChangeFailure } from '@/lib/utils';
import type { EmailChangeErrorLabels } from '@/lib/utils';

import { Button } from '@/components/ui';

import { confirmEmailChangeAction } from './registration.actions';

type EmailChangeVerificationLabels = {
  working: string;
  successTitle: string;
  successDescription: string;
  signInCta: string;
  failures: EmailChangeErrorLabels;
};

type EmailChangeVerificationProps = {
  token: string;
  labels: EmailChangeVerificationLabels;
};

/*
  The same shape as `EmailVerification`, and separate from it for the same reason the
  routes are separate: the two links do different things, and the screens that report them
  have nothing to say in common. That one hands over a login identifier for the first
  time; this one says an address moved.

  A client component rather than page-render logic, because confirming *writes*. A page
  that wrote while rendering would fire again on every refresh, every back-navigation and
  every link prefetch — and the second run would find the token already spent.

  Signing in again is offered but not demanded. The session already open in another tab
  keeps working: the address is not what the session is keyed on, and the account did not
  change hands.
*/
export function EmailChangeVerification({ token, labels }: EmailChangeVerificationProps) {
  const [email, setEmail] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ title: string; description: string } | null>(null);

  /*
    React runs effects twice in development's strict mode. The token is single-use, so the
    second call would find it spent and show a failure over a success that already
    happened — this makes the request fire once per mount whatever the mode.
  */
  const hasRequested = useRef(false);

  useEffect(() => {
    if (hasRequested.current) {
      return;
    }

    hasRequested.current = true;

    confirmEmailChangeAction(token).then(result => {
      if (isSuccess(result) && result.result) {
        setEmail(result.result);

        return;
      }

      setFailure(resolveEmailChangeFailure(result.errors[0]?.code ?? 0, labels.failures));
    });
  }, [token, labels.failures]);

  if (failure) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <XCircle className="text-destructive size-10" aria-hidden />
        <h1 className="text-2xl">{failure.title}</h1>
        <p className="text-muted-foreground text-sm">{failure.description}</p>

        <Button variant="default" nativeButton={false} render={<Link href={ROUTES.SIGN_IN.HREF} />}>
          {labels.signInCta}
        </Button>
      </div>
    );
  }

  if (!email) {
    return <p className="text-muted-foreground text-center text-sm">{labels.working}</p>;
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <CheckCircle2 className="text-primary size-10" aria-hidden />
      <h1 className="text-2xl">{labels.successTitle}</h1>
      <p className="text-muted-foreground text-sm">{labels.successDescription}</p>

      {/* Shown back, because "which address did it land on" is the one thing worth confirming. */}
      <p className="border-border bg-muted/40 w-full rounded-lg border px-4 py-3 font-mono text-sm break-all">{email}</p>

      <Button variant="default" nativeButton={false} render={<Link href={ROUTES.SIGN_IN.HREF} />}>
        {labels.signInCta}
      </Button>
    </div>
  );
}
