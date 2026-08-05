'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui';

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/*
  An error boundary has to be a client component, which is the one place a translation
  hook is used instead of a server lookup — there is no server render to hand strings
  down from when this renders.
*/
export default function DashboardError({ reset }: DashboardErrorProps) {
  const l10n = useTranslations();

  const handleRetryClick = (): void => {
    reset();
  };

  return (
    <div className="flex max-w-xl flex-col items-start gap-4">
      <h1 className="text-2xl">{l10n('DASHBOARD_ERROR_TITLE')}</h1>

      <p className="text-muted-foreground">{l10n('DASHBOARD_ERROR_DESCRIPTION')}</p>

      <Button variant="appPrimary" onClick={handleRetryClick}>
        {l10n('DASHBOARD_ERROR_RETRY')}
      </Button>
    </div>
  );
}
