import type { Metadata } from 'next';

import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/l10n/navigation';

import { ROUTES } from '@/constants/routes.const';

import { requireAdminArea } from '@/lib/auth';
import { UserService, getStorageStatus } from '@/lib/services';
import { buildNoticeCreateLabels } from '@/lib/utils';

import { NoticeCreateForm } from '@/components/notices';

const userService = new UserService();

type AdminNoticeCreatePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: AdminNoticeCreatePageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('NOTICES_CREATE_TITLE'),
    robots: { index: false, follow: false },
  };
}

export default async function AdminNoticeCreatePage() {
  // A teacher or student who reaches this URL is sent to /unauthorized, not sign-in.
  await requireAdminArea();

  const l10n = await getTranslations();

  const [storageStatus, sessions] = await Promise.all([getStorageStatus(), userService.listStudentSessions()]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href={ROUTES.ADMIN_NOTICES.HREF}
          className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-colors">
          <ArrowLeft className="size-4" />
          {l10n('NOTICES_BACK_TO_LIST')}
        </Link>

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl">{l10n('NOTICES_CREATE_TITLE')}</h1>
          <p className="text-muted-foreground text-sm">{l10n('NOTICES_CREATE_DESCRIPTION')}</p>
        </div>
      </div>

      <div className="surface-card p-4 sm:p-6">
        <NoticeCreateForm
          sessions={sessions}
          canChooseAudience
          listHref={ROUTES.ADMIN_NOTICES.HREF}
          storageBlocked={storageStatus.full}
          storageNearFull={storageStatus.nearFull}
          labels={buildNoticeCreateLabels(l10n)}
        />
      </div>
    </div>
  );
}
