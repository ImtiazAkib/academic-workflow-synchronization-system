import { getTranslations } from 'next-intl/server';

import { LoadingTable } from '@/components/shared';

export default async function StudentTeachersLoading() {
  const l10n = await getTranslations();

  return <LoadingTable label={l10n('DASHBOARD_LOADING')} />;
}
