import { getTranslations } from 'next-intl/server';

import { NotFoundContent } from '@/components/shared';

export default async function NotFound() {
  const l10n = await getTranslations();

  return <NotFoundContent title={l10n('NOT_FOUND_TITLE')} description={l10n('NOT_FOUND_DESCRIPTION')} ctaLabel={l10n('NOT_FOUND_CTA')} />;
}
