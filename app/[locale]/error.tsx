'use client';

import { useTranslations } from 'next-intl';

import { Container } from '@/components/shared';
import { Button } from '@/components/ui';

type LocaleErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/*
  The boundary that was missing between `global-error.tsx` and the dashboard.

  Without it, a throw anywhere in `(auth)`, `(marketing)` or `/unauthorized` escaped all
  the way to the global handler — which replaces the entire document, hardcodes
  `lang="en"` and renders two English sentences. A Bengali visitor whose sign-in threw
  lost the shell, the language selector and the language, and had no way back to any of
  them.

  One file rather than one per route group: it sits under the locale layout and inside
  `NextIntlClientProvider`, so it can translate, and it covers every group beneath it.

  A client component, like every error boundary — which is the one place a translation
  hook is used instead of a server lookup, because there is no server render to hand
  strings down from when this renders.
*/
export default function LocaleError({ reset }: LocaleErrorProps) {
  const l10n = useTranslations();

  const handleRetryClick = (): void => {
    reset();
  };

  return (
    <section className="section-py flex min-h-dvh items-center">
      <Container className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl sm:text-3xl">{l10n('DASHBOARD_ERROR_TITLE')}</h1>

        <p className="text-muted-foreground max-w-md">{l10n('DASHBOARD_ERROR_DESCRIPTION')}</p>

        <Button variant="appPrimary" onClick={handleRetryClick}>
          {l10n('DASHBOARD_ERROR_RETRY')}
        </Button>
      </Container>
    </section>
  );
}
