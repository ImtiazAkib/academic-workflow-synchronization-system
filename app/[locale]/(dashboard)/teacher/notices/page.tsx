import type { Metadata } from 'next';

import { Megaphone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/l10n/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';

import { DashboardNotices } from '@/components/dashboard';
import { Button } from '@/components/ui';

type TeacherNoticesPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: TeacherNoticesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('NOTICES_METADATA_TITLE'),
    robots: { index: false, follow: false },
  };
}

/*
  A teacher's own notices, and a button to publish another. It lists what they published —
  not the feed they read — because a session notice is addressed to students and would
  never come back through the teacher's own feed, so "my notices" is the only screen where
  the author can see it went out. The list is `DashboardNotices` scoped to the publisher,
  the same rendering the department sees, rather than a second one that could disagree.
*/
export default async function TeacherNoticesPage() {
  const sessionUser = await requireRole(USER_ROLES.TEACHER);

  const l10n = await getTranslations();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl">{l10n('NOTICES_TITLE')}</h1>
          <p className="text-muted-foreground text-sm">{l10n('TEACHER_NOTICES_INTRO')}</p>
        </div>

        <Button variant="default" nativeButton={false} render={<Link href={ROUTES.TEACHER_NOTICES_NEW.HREF} />}>
          <Megaphone className="size-4" />
          {l10n('NOTICES_CREATE_CTA')}
        </Button>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-regular-semibold">{l10n('TEACHER_NOTICES_MINE_TITLE')}</h2>

        <DashboardNotices role={sessionUser.role} publisherId={sessionUser.userId} limit={null} />
      </section>
    </div>
  );
}
