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
  usersLabel: string;
  languageLabel: string;
  signOutLabel: string;
  locale: string;
};

export function DashboardTopbar({
  role,
  roleLabel,
  welcome,
  navLabel,
  overviewLabel,
  usersLabel,
  languageLabel,
  signOutLabel,
  locale,
}: DashboardTopbarProps) {
  return (
    <header className="border-border bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="flex flex-col px-4 lg:px-8">
        {/*
          One row that never wraps: the greeting takes the slack and truncates, the
          controls keep their size. Wrapping put the language selector on its own line
          on a phone and left the row looking like two unrelated bars.
        */}
        <div className="flex h-16 items-center gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-regular-semibold truncate">{welcome}</span>
            <span className="bg-secondary text-secondary-foreground hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline">
              {roleLabel}
            </span>
          </div>

          <div className="ms-auto flex shrink-0 items-center gap-2">
            <LanguageSelector label={languageLabel} />
            <SignOutButton label={signOutLabel} locale={locale} />
          </div>
        </div>

        {/*
          The sidebar is hidden below `lg`, so the same nav runs here instead — scrolling
          sideways rather than wrapping, so a third entry cannot push the bar taller.
        */}
        <DashboardNav
          role={role}
          navLabel={navLabel}
          overviewLabel={overviewLabel}
          usersLabel={usersLabel}
          className="border-border -mx-4 gap-1 overflow-x-auto border-t px-4 py-2 lg:hidden"
        />
      </div>
    </header>
  );
}
