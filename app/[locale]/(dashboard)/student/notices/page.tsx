import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { StudentService } from '@/lib/services';

import { DashboardNotices } from '@/components/dashboard';

const studentService = new StudentService();

export async function generateMetadata(): Promise<Metadata> {
  const l10n = await getTranslations();
  return { title: l10n('NOTICES_METADATA_TITLE'), robots: { index: false, follow: false } };
}

export default async function StudentNoticesPage() {
  const user = await requireRole(USER_ROLES.STUDENT);
  const l10n = await getTranslations();
  const viewerSession = await studentService.resolveSession(user.userId);
  return (
    <div className="flex w-full max-w-3xl min-w-0 flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl">{l10n('NOTICES_TITLE')}</h1>
        <p className="text-muted-foreground text-sm">{l10n('NOTICES_INTRO')}</p>
      </div>
      <DashboardNotices role={USER_ROLES.STUDENT} viewerSession={viewerSession} limit={null} />
    </div>
  );
}
