import { getTranslations } from 'next-intl/server';

import { requireAdminArea } from '@/lib/auth';

import { DashboardNotices } from '@/components/dashboard';

export default async function AdminDashboardPage() {
  // A teacher or student who reaches this URL is sent to /unauthorized, not sign-in.
  const sessionUser = await requireAdminArea();

  const l10n = await getTranslations();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl">{l10n('DASHBOARD_ADMIN_TITLE')}</h1>
        <p className="text-medium-normal text-muted-foreground">{l10n('DASHBOARD_ADMIN_INTRO')}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-regular-semibold">{l10n('DASHBOARD_NOTICES_TITLE')}</h2>

        {/* An administrator sees every audience here — they are the ones publishing. */}
        <DashboardNotices role={sessionUser.role} />
      </section>
    </div>
  );
}
