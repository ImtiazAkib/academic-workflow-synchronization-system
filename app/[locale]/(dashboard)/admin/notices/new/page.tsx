import type { Metadata } from 'next';

import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/l10n/navigation';

import { ROUTES } from '@/constants/routes.const';

import { requireAdminArea } from '@/lib/auth';
import { getStorageStatus } from '@/lib/services';

import { NoticeCreateForm } from '@/components/notices';

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

  const storageStatus = await getStorageStatus();

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
          storageBlocked={storageStatus.full}
          storageNearFull={storageStatus.nearFull}
          labels={{
            fields: {
              title: l10n('NOTICES_FIELD_TITLE_LABEL'),
              body: l10n('NOTICES_FIELD_BODY_LABEL'),
              audience: l10n('NOTICES_FIELD_AUDIENCE_LABEL'),
              image: l10n('NOTICES_FIELD_IMAGE_LABEL'),
            },
            fieldErrors: {
              titleRequired: l10n('NOTICES_FIELD_TITLE_REQUIRED'),
              titleTooLong: l10n('NOTICES_FIELD_TITLE_TOO_LONG'),
              bodyOrImageRequired: l10n('NOTICES_FIELD_BODY_OR_IMAGE_REQUIRED'),
              bodyTooLong: l10n('NOTICES_FIELD_BODY_TOO_LONG'),
              audienceInvalid: l10n('NOTICES_FIELD_AUDIENCE_INVALID'),
              imageTooLarge: l10n('NOTICES_FIELD_IMAGE_TOO_LARGE'),
              imageType: l10n('NOTICES_FIELD_IMAGE_TYPE'),
            },
            audiences: {
              all: l10n('NOTICES_AUDIENCE_ALL'),
              teachers: l10n('NOTICES_AUDIENCE_TEACHERS'),
              students: l10n('NOTICES_AUDIENCE_STUDENTS'),
            },
            audienceHint: l10n('NOTICES_FIELD_AUDIENCE_HINT'),
            imageHint: l10n('NOTICES_FIELD_IMAGE_HINT'),
            imagePreviewAlt: l10n('NOTICES_IMAGE_PREVIEW_ALT'),
            imageRemove: l10n('NOTICES_IMAGE_REMOVE'),
            storageWarning: l10n('NOTICES_STORAGE_WARNING'),
            storageFull: l10n('NOTICES_STORAGE_FULL'),
            submit: l10n('NOTICES_CREATE_SUBMIT'),
            working: l10n('NOTICES_DIALOG_WORKING'),
            cancel: l10n('NOTICES_DIALOG_CANCEL'),
            published: l10n('NOTICES_TOAST_PUBLISHED'),
            errors: {
              titleRequired: l10n('NOTICES_ERROR_TITLE'),
              bodyOrImageRequired: l10n('NOTICES_ERROR_BODY_OR_IMAGE'),
              audienceInvalid: l10n('NOTICES_ERROR_AUDIENCE'),
              imageTooLarge: l10n('NOTICES_ERROR_IMAGE_TOO_LARGE'),
              imageType: l10n('NOTICES_ERROR_IMAGE_TYPE'),
              storageFull: l10n('NOTICES_ERROR_STORAGE_FULL'),
              generic: l10n('NOTICES_ERROR_GENERIC'),
            },
          }}
        />
      </div>
    </div>
  );
}
