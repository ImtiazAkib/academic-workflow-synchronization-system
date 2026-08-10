import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';

import { UploadsPanel } from '@/components/uploads';

type TeacherUploadsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: TeacherUploadsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('UPLOADS_METADATA_TITLE'),
    robots: { index: false, follow: false },
  };
}

/*
  A teacher's own uploads and their compression — scoped to the account, so one teacher's
  screen never lists another's. The materials and notice images they upload are stored at
  once and shrunk afterwards; this is where they see that land, or fail with a reason.
*/
export default async function TeacherUploadsPage() {
  const sessionUser = await requireRole(USER_ROLES.TEACHER);

  const l10n = await getTranslations();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl">{l10n('UPLOADS_TITLE')}</h1>
        <p className="text-muted-foreground text-sm">{l10n('UPLOADS_INTRO')}</p>
      </div>

      <UploadsPanel userId={sessionUser.userId} />
    </div>
  );
}
