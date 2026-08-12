import type { NavLabels } from '@/lib/utils';

import { LanguageSelector, ThemeSelector } from '@/components/shared';
import type { ThemeSelectorLabels } from '@/components/shared';

import { AccountMenu } from './account-menu';
import { DashboardBreadcrumb } from './dashboard-breadcrumb';
import { DashboardNav } from './dashboard-nav';

import type { UserRole } from '@/types';

type DashboardTopbarProps = {
  role: UserRole;
  navLabels: NavLabels;
  navAriaLabel: string;
  breadcrumbLabel: string;
  overviewLabel: string;
  user: { name: string; roleLabel: string; initials: string };
  profileLabel: string;
  signOutLabel: string;
  languageLabel: string;
  themeLabels: ThemeSelectorLabels;
  locale: string;
};

/*
  A solid institutional bar, not the old frosted-glass one: location on the left (breadcrumb),
  utilities on the right (theme, language, account). Below `lg` the sidebar is gone, so the same
  nav runs as a horizontally-scrolling strip under this row until the mobile drawer lands in R3b.
*/
export function DashboardTopbar({
  role,
  navLabels,
  navAriaLabel,
  breadcrumbLabel,
  overviewLabel,
  user,
  profileLabel,
  signOutLabel,
  languageLabel,
  themeLabels,
  locale,
}: DashboardTopbarProps) {
  return (
    <header className="border-border bg-background sticky top-0 z-40 border-b">
      <div className="flex flex-col px-4 lg:px-8">
        <div className="flex h-16 items-center gap-3">
          <DashboardBreadcrumb role={role} labels={navLabels} overviewLabel={overviewLabel} ariaLabel={breadcrumbLabel} />

          <div className="ms-auto flex shrink-0 items-center gap-2">
            <ThemeSelector labels={themeLabels} />

            <LanguageSelector label={languageLabel} />

            <AccountMenu
              name={user.name}
              roleLabel={user.roleLabel}
              initials={user.initials}
              profileLabel={profileLabel}
              signOutLabel={signOutLabel}
              locale={locale}
            />
          </div>
        </div>

        <DashboardNav
          role={role}
          labels={navLabels}
          ariaLabel={navAriaLabel}
          variant="bar"
          className="border-border -mx-4 gap-1 overflow-x-auto border-t px-4 py-2 lg:hidden"
        />
      </div>
    </header>
  );
}
