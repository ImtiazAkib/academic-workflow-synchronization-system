import { getTranslations } from 'next-intl/server';

import { requireAdminArea } from '@/lib/auth';

export default async function AdminDashboardPage() {
  // A teacher or student who reaches this URL is sent to /unauthorized, not sign-in.
  await requireAdminArea();

  const l10n = await getTranslations();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl sm:text-3xl">{l10n('DASHBOARD_ADMIN_TITLE')}</h1>

      <p className="text-medium-normal text-muted-foreground">{l10n('DASHBOARD_ADMIN_INTRO')}</p>

      <p className="surface-card text-muted-foreground p-4 text-sm">{l10n('DASHBOARD_UNDER_CONSTRUCTION')}</p>
    </div>
  );
}
