import { getTranslations } from 'next-intl/server';

import { USER_ROLES } from '@/constants';

import { requireRole } from '@/lib/auth';

import { DashboardNotices } from '@/components/dashboard';

export default async function TeacherDashboardPage() {
  await requireRole(USER_ROLES.TEACHER);

  const l10n = await getTranslations();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl">{l10n('DASHBOARD_TEACHER_TITLE')}</h1>
        <p className="text-medium-normal text-muted-foreground">{l10n('DASHBOARD_TEACHER_INTRO')}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-regular-semibold">{l10n('DASHBOARD_NOTICES_TITLE')}</h2>

        <DashboardNotices role={USER_ROLES.TEACHER} />
      </section>
    </div>
  );
}
