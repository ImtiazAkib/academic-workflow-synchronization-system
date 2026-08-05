import { getTranslations } from 'next-intl/server';

export default async function DashboardNotFound() {
  const l10n = await getTranslations();

  return (
    <div className="flex max-w-xl flex-col gap-3">
      <h1 className="text-2xl">{l10n('DASHBOARD_NOT_FOUND_TITLE')}</h1>

      <p className="text-muted-foreground">{l10n('DASHBOARD_NOT_FOUND_DESCRIPTION')}</p>
    </div>
  );
}
