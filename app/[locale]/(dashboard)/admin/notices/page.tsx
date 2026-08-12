import type { Metadata } from 'next';

import { Megaphone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/l10n/navigation';

import { ROUTES } from '@/constants/routes.const';

import { requireAdminArea } from '@/lib/auth';

import { DashboardNotices } from '@/components/dashboard';
import { Button } from '@/components/ui';

type AdminNoticesPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: AdminNoticesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('NOTICES_METADATA_TITLE'),
    robots: { index: false, follow: false },
  };
}

/*
  A plain server component, with no screen component under it — unlike users, courses and
  the timetable. Those three need one because their rows open dialogs and hold selection
  state; a notice is published and then read, so there is nothing on this page for a client
  component to remember.

  The archive is the same `DashboardNotices` the three home screens render, with its limit
  lifted. One component means the administrator checking what went out sees exactly what
  the department saw, rather than a second rendering that could quietly disagree.
*/
export default async function AdminNoticesPage() {
  // A teacher or student who reaches this URL is sent to /unauthorized, not sign-in.
  const sessionUser = await requireAdminArea();

  const l10n = await getTranslations();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl">{l10n('NOTICES_TITLE')}</h1>
          <p className="text-muted-foreground text-sm">{l10n('NOTICES_INTRO')}</p>
        </div>

        <Button variant="default" nativeButton={false} render={<Link href={ROUTES.ADMIN_NOTICES_NEW.HREF} />}>
          <Megaphone className="size-4" />
          {l10n('NOTICES_CREATE_CTA')}
        </Button>
      </div>

      {/*
        Wrapped in a titled section so the heading order runs h1 → h2 → the cards' h3. The
        three home screens already do this; without it this page jumped a level.

        No limit: this is the record of everything published, not a summary of it.
      */}
      <section className="flex flex-col gap-3">
        <h2 className="text-regular-semibold">{l10n('NOTICES_PUBLISHED_TITLE')}</h2>

        <DashboardNotices role={sessionUser.role} limit={null} />
      </section>
    </div>
  );
}
