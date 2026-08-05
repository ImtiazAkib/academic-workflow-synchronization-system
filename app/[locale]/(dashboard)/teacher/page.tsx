import { getTranslations } from 'next-intl/server';

import { USER_ROLES } from '@/constants';

import { requireRole } from '@/lib/auth';

export default async function TeacherDashboardPage() {
  await requireRole(USER_ROLES.TEACHER);

  const l10n = await getTranslations();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl sm:text-3xl">{l10n('DASHBOARD_TEACHER_TITLE')}</h1>

      <p className="text-medium-normal text-muted-foreground">{l10n('DASHBOARD_TEACHER_INTRO')}</p>

      <p className="surface-card text-muted-foreground p-4 text-sm">{l10n('DASHBOARD_UNDER_CONSTRUCTION')}</p>
    </div>
  );
}
