import { getTranslations } from 'next-intl/server';

import { LoadingForm } from '@/components/shared';

export default async function AdminScheduleNewLoading() {
  const l10n = await getTranslations();

  return <LoadingForm label={l10n('DASHBOARD_LOADING')} />;
}
