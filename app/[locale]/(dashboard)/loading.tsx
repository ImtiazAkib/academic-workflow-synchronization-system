import { getTranslations } from 'next-intl/server';

export default async function DashboardLoading() {
  const l10n = await getTranslations();

  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">{l10n('DASHBOARD_LOADING')}</span>

      {/* Skeleton shaped like the page that is coming, so nothing jumps on arrival. */}
      <div className="bg-muted h-8 w-64 animate-pulse rounded-md" />
      <div className="bg-muted h-5 w-full max-w-xl animate-pulse rounded-md" />
      <div className="bg-muted h-20 w-full max-w-2xl animate-pulse rounded-md" />
    </div>
  );
}
