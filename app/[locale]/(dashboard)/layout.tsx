import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';
import { Toaster } from 'sonner';

import { requireSession } from '@/lib/auth';
import { resolveRoleLabel } from '@/lib/utils';

import { DashboardSidebar, DashboardTopbar } from '@/components/dashboard';

type DashboardLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Omit<DashboardLayoutProps, 'children'>): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('DASHBOARD_METADATA_TITLE'),
    /*
      The enforcing half of the crawler exclusion set up in step 3. `robots.txt`
      disallows these paths, but that is a request a crawler may ignore — this is the
      instruction it must not.
    */
    robots: { index: false, follow: false },
  };
}

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  /*
    The locale is still read here, not for next-intl but for the sign-out form:
    `next/root-params` is unavailable inside Server Actions, so the action is handed
    the locale explicitly rather than looking it up.
  */
  const { locale } = await params;

  // Redirects to sign-in if there is no session, so nothing below runs signed out.
  const sessionUser = await requireSession();

  const l10n = await getTranslations();

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <DashboardSidebar
        role={sessionUser.role}
        navLabel={l10n('DASHBOARD_NAV_LABEL')}
        overviewLabel={l10n('DASHBOARD_NAV_OVERVIEW')}
        usersLabel={l10n('DASHBOARD_NAV_USERS')}
        coursesLabel={l10n('DASHBOARD_NAV_COURSES')}
        scheduleLabel={l10n('DASHBOARD_NAV_SCHEDULE')}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          role={sessionUser.role}
          roleLabel={resolveRoleLabel(sessionUser.role, l10n)}
          welcome={l10n('DASHBOARD_WELCOME', { name: sessionUser.name })}
          navLabel={l10n('DASHBOARD_NAV_LABEL')}
          overviewLabel={l10n('DASHBOARD_NAV_OVERVIEW')}
          usersLabel={l10n('DASHBOARD_NAV_USERS')}
          coursesLabel={l10n('DASHBOARD_NAV_COURSES')}
          scheduleLabel={l10n('DASHBOARD_NAV_SCHEDULE')}
          languageLabel={l10n('LANGUAGE_SELECTOR_LABEL')}
          signOutLabel={l10n('DASHBOARD_SIGN_OUT')}
          locale={locale}
        />

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>

      {/*
        Mounted once for the whole dashboard rather than per screen, so an action can
        confirm itself from anywhere underneath without each page wiring up its own.
      */}
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
