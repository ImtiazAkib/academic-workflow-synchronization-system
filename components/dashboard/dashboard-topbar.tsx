import type { NavLabels } from '@/lib/utils';

import { LanguageSelector, ThemeSelector } from '@/components/shared';
import type { ThemeSelectorLabels } from '@/components/shared';

import { AccountMenu } from './account-menu';
import { DashboardBreadcrumb } from './dashboard-breadcrumb';
import { DashboardMobileNav } from './dashboard-mobile-nav';

import type { UserRole } from '@/types';

type DashboardTopbarProps = {
  role: UserRole;
  navLabels: NavLabels;
  navAriaLabel: string;
  breadcrumbLabel: string;
  overviewLabel: string;
  logoLabel: string;
  menuOpenLabel: string;
  menuCloseLabel: string;
  user: { name: string; roleLabel: string; initials: string };
  profileLabel: string;
  signOutLabel: string;
  languageLabel: string;
  themeLabels: ThemeSelectorLabels;
  locale: string;
};

/*
  A solid institutional bar, not the old frosted-glass one. One row: on the left the mobile menu
  button (below `lg`, where the sidebar is hidden) and the location breadcrumb; on the right the
  utilities - theme, language, account. The below-`lg` nav now lives in the drawer the menu button
  opens, so this bar no longer carries a second scrolling nav row.
*/
export function DashboardTopbar({
  role,
  navLabels,
  navAriaLabel,
  breadcrumbLabel,
  overviewLabel,
  logoLabel,
  menuOpenLabel,
  menuCloseLabel,
  user,
  profileLabel,
  signOutLabel,
  languageLabel,
  themeLabels,
  locale,
}: DashboardTopbarProps) {
  return (
    <header className="border-border bg-background z-40 shrink-0 border-b">
      <div className="flex h-16 items-center gap-2 px-4 lg:px-8">
        <DashboardMobileNav
          role={role}
          navLabels={navLabels}
          navAriaLabel={navAriaLabel}
          logoLabel={logoLabel}
          openLabel={menuOpenLabel}
          closeLabel={menuCloseLabel}
          user={user}
          profileLabel={profileLabel}
        />

        <DashboardBreadcrumb role={role} labels={navLabels} overviewLabel={overviewLabel} profileLabel={profileLabel} ariaLabel={breadcrumbLabel} />

        <div className="ms-auto flex shrink-0 items-center gap-2">
          {/* Compact icon-dropdowns, so they stay in the bar at every width without overflowing on a phone. */}
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
    </header>
  );
}
