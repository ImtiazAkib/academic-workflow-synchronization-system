import { getTranslations } from 'next-intl/server';

import { LoadingPage } from '@/components/shared';

export default async function AdminLoading() {
  const l10n = await getTranslations();

  return <LoadingPage label={l10n('DASHBOARD_LOADING')} />;
}
