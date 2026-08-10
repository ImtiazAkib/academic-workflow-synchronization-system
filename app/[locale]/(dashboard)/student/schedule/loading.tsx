import { getTranslations } from 'next-intl/server';

import { LoadingWeek } from '@/components/shared';

export default async function StudentScheduleLoading() {
  const l10n = await getTranslations();

  return <LoadingWeek label={l10n('DASHBOARD_LOADING')} />;
}
