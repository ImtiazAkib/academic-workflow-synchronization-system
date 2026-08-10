import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { requireAdminArea } from '@/lib/auth';

import { UploadsPanel } from '@/components/uploads';

type AdminUploadsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: AdminUploadsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('UPLOADS_METADATA_TITLE'),
    robots: { index: false, follow: false },
  };
}

/*
  The department's uploads and how their compression is going. Every material and every
  notice image is stored as it arrives and shrunk in the background; this is where an
  administrator watches that finish — or sees which one failed, and why.
*/
export default async function AdminUploadsPage() {
  // A teacher or student who reaches this URL is sent to /unauthorized, not sign-in.
  await requireAdminArea();

  const l10n = await getTranslations();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl">{l10n('UPLOADS_TITLE')}</h1>
        <p className="text-muted-foreground text-sm">{l10n('UPLOADS_INTRO')}</p>
      </div>

      <UploadsPanel />
    </div>
  );
}
