import { UserRole } from '@/types';

import { LanguageSelector } from '@/components/shared';

import { DashboardNav } from './dashboard-nav';
import { SignOutButton } from './sign-out-button';

type DashboardTopbarProps = {
  role: UserRole;
  roleLabel: string;
  welcome: string;
  navLabel: string;
  overviewLabel: string;
  languageLabel: string;
  signOutLabel: string;
  locale: string;
};

export function DashboardTopbar({ role, roleLabel, welcome, navLabel, overviewLabel, languageLabel, signOutLabel, locale }: DashboardTopbarProps) {
  return (
    <header className="border-border bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="flex flex-col gap-3 px-4 py-3 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-regular-semibold">{welcome}</span>
            <span className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">{roleLabel}</span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector label={languageLabel} />
            <SignOutButton label={signOutLabel} locale={locale} />
          </div>
        </div>

        {/* The sidebar is hidden below `lg`, so the same nav runs here instead. */}
        <DashboardNav role={role} navLabel={navLabel} overviewLabel={overviewLabel} className="lg:hidden" />
      </div>
    </header>
  );
}
