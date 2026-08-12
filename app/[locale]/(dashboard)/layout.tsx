import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { MAIN_CONTENT_ID } from '@/constants/a11y.const';

import { requireSession } from '@/lib/auth';
import { resolveInitials, resolveRoleLabel } from '@/lib/utils';

import { DashboardSidebar, DashboardTopbar } from '@/components/dashboard';
import { Toaster } from '@/components/shared';
import { DialogLabelsProvider } from '@/components/ui';

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

  /*
    The nav labels, resolved once here (a server component) and handed down as one object,
    rather than as a dozen separate props to each of the sidebar and topbar. `resolveNavModel`
    turns them into the sectioned model both placements render from.
  */
  const navLabels = {
    overview: l10n('DASHBOARD_NAV_OVERVIEW'),
    users: l10n('DASHBOARD_NAV_USERS'),
    courses: l10n('DASHBOARD_NAV_COURSES'),
    schedule: l10n('DASHBOARD_NAV_SCHEDULE'),
    materials: l10n('DASHBOARD_NAV_MATERIALS'),
    teachers: l10n('DASHBOARD_NAV_TEACHERS'),
    notices: l10n('DASHBOARD_NAV_NOTICES'),
    uploads: l10n('DASHBOARD_NAV_UPLOADS'),
    sectionAcademic: l10n('DASHBOARD_NAV_SECTION_ACADEMIC'),
    sectionCommunication: l10n('DASHBOARD_NAV_SECTION_COMMUNICATION'),
    sectionDirectory: l10n('DASHBOARD_NAV_SECTION_DIRECTORY'),
    sectionAdministration: l10n('DASHBOARD_NAV_SECTION_ADMINISTRATION'),
  };

  const user = {
    name: sessionUser.name,
    roleLabel: resolveRoleLabel(sessionUser.role, l10n),
    initials: resolveInitials(sessionUser.name),
  };

  return (
    /*
      One provider for the whole dashboard, so every confirm and edit dialog's close button
      gets its label without each of the seven of them taking a prop for it. The value
      crosses from here — a server component — into the client context once.
    */
    <DialogLabelsProvider close={l10n('DIALOG_CLOSE')}>
      <div className="flex min-h-dvh flex-col lg:flex-row">
        <DashboardSidebar
          role={sessionUser.role}
          navLabels={navLabels}
          navAriaLabel={l10n('DASHBOARD_NAV_LABEL')}
          logoLabel={l10n('APP_LOGO_ALT')}
          user={user}
          profileLabel={l10n('DASHBOARD_NAV_PROFILE')}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardTopbar
            role={sessionUser.role}
            navLabels={navLabels}
            navAriaLabel={l10n('DASHBOARD_NAV_LABEL')}
            breadcrumbLabel={l10n('DASHBOARD_BREADCRUMB_LABEL')}
            overviewLabel={l10n('DASHBOARD_NAV_OVERVIEW')}
            logoLabel={l10n('APP_LOGO_ALT')}
            menuOpenLabel={l10n('DASHBOARD_MENU_OPEN')}
            menuCloseLabel={l10n('DASHBOARD_MENU_CLOSE')}
            user={user}
            profileLabel={l10n('DASHBOARD_NAV_PROFILE')}
            signOutLabel={l10n('DASHBOARD_SIGN_OUT')}
            languageLabel={l10n('LANGUAGE_SELECTOR_LABEL')}
            themeLabels={{
              group: l10n('THEME_SELECTOR_LABEL'),
              light: l10n('THEME_LIGHT'),
              dark: l10n('THEME_DARK'),
              system: l10n('THEME_SYSTEM'),
            }}
            locale={locale}
          />

          <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 p-4 lg:p-8">
            {children}
          </main>
        </div>

        {/*
          Mounted once for the whole dashboard rather than per screen, so an action can
          confirm itself from anywhere underneath without each page wiring up its own.
        */}
        <Toaster />
      </div>
    </DialogLabelsProvider>
  );
}
