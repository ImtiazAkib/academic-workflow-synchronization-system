'use client';

import { useEffect, useRef, useState } from 'react';

import { CheckCircle2, Copy, XCircle } from 'lucide-react';

import { Link } from '@/l10n/navigation';

import { ROUTES } from '@/constants/routes.const';

import { isSuccess } from '@/lib/result';
import { resolveVerificationFailure } from '@/lib/utils';
import type { VerificationErrorLabels } from '@/lib/utils';

import { Button } from '@/components/ui';

import { verifyEmailAction } from './registration.actions';

type EmailVerificationLabels = {
  working: string;
  successTitle: string;
  successDescription: string;
  sentNote: string;
  approvalNote: string;
  copy: string;
  copied: string;
  signInCta: string;
  registerCta: string;
  failures: VerificationErrorLabels;
};

type EmailVerificationProps = {
  token: string;
  labels: EmailVerificationLabels;
};

/*
  A client component rather than page-render logic, because confirming an address
  *writes*: it flips `emailVerified` and mints an identifier. A page that did that while
  rendering would fire again on every refresh, every back-navigation and every link
  prefetch — and the second run would find the token already spent.

  Running it from an effect means it happens once, on a real visit, in response to
  somebody actually arriving.
*/
export function EmailVerification({ token, labels }: EmailVerificationProps) {
  const [loginId, setLoginId] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ title: string; description: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  /*
    React runs effects twice in development's strict mode. The token is single-use, so
    the second call would find it spent and show a failure over a success that already
    happened — this makes the request fire once per mount whatever the mode.
  */
  const hasRequested = useRef(false);

  useEffect(() => {
    if (hasRequested.current) {
      return;
    }

    hasRequested.current = true;

    verifyEmailAction(token).then(result => {
      if (isSuccess(result) && result.result) {
        setLoginId(result.result);

        return;
      }

      setFailure(resolveVerificationFailure(result.errors[0]?.code ?? 0, labels.failures));
    });
  }, [token, labels.failures]);

  const handleCopyClick = (): void => {
    if (!loginId) {
      return;
    }

    navigator.clipboard.writeText(loginId).then(() => {
      setIsCopied(true);
    });
  };

  if (failure) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <XCircle className="text-destructive size-10" aria-hidden />
        <h1 className="text-2xl">{failure.title}</h1>
        <p className="text-muted-foreground text-sm">{failure.description}</p>

        <Button variant="default" nativeButton={false} render={<Link href={ROUTES.REGISTER.HREF} />}>
          {labels.registerCta}
        </Button>
      </div>
    );
  }

  if (!loginId) {
    return <p className="text-muted-foreground text-center text-sm">{labels.working}</p>;
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <CheckCircle2 className="text-primary size-10" aria-hidden />
      <h1 className="text-2xl">{labels.successTitle}</h1>
      <p className="text-muted-foreground text-sm">{labels.successDescription}</p>

      {/*
        Shown large and copyable because this is the one moment the identifier is on a
        screen. It is also emailed — a tab gets closed, an inbox does not.
      */}
      <p className="border-border bg-muted/40 w-full rounded-lg border px-4 py-3 font-mono text-2xl font-bold tracking-widest">{loginId}</p>

      <Button type="button" variant="outline" size="sm" onClick={handleCopyClick}>
        <Copy className="size-3.5" />
        {isCopied ? labels.copied : labels.copy}
      </Button>

      <p className="text-muted-foreground text-xs">{labels.sentNote}</p>

      <p className="border-border text-muted-foreground w-full rounded-lg border border-dashed px-4 py-3 text-xs">{labels.approvalNote}</p>

      <Button variant="default" nativeButton={false} render={<Link href={ROUTES.SIGN_IN.HREF} />}>
        {labels.signInCta}
      </Button>
    </div>
  );
}
