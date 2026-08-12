import { APP_DATA, ROUTES } from '@/constants';
import { Link } from '@/l10n/navigation';

import type { NavLabels } from '@/lib/utils';

import { AppLogo } from '@/components/shared';
import { Avatar, AvatarFallback } from '@/components/ui';

import { DashboardNav } from './dashboard-nav';

import type { UserRole } from '@/types';

type DashboardSidebarProps = {
  role: UserRole;
  navLabels: NavLabels;
  navAriaLabel: string;
  logoLabel: string;
  user: { name: string; roleLabel: string; initials: string };
  profileLabel: string;
};

/*
  Hidden below `lg`, where the same nav runs across the topbar instead. Three bands: a logo
  header the height of the topbar so the two line up across the shell, the scrolling sectioned
  nav, and a user block pinned to the bottom that carries identity and links to the profile -
  the who-am-I signal the topbar greeting used to give.
*/
export function DashboardSidebar({ role, navLabels, navAriaLabel, logoLabel, user, profileLabel }: DashboardSidebarProps) {
  return (
    <aside className="bg-sidebar border-sidebar-border hidden h-dvh w-60 shrink-0 flex-col border-r lg:flex">
      <div className="border-sidebar-border flex h-16 shrink-0 items-center border-b px-4">
        <Link href={ROUTES.HOME.HREF} className="flex items-center gap-2.5">
          <AppLogo label={logoLabel} className="size-8" />
          <span className="font-heading text-regular-bold text-sidebar-foreground tracking-tight">{APP_DATA.SHORT_NAME}</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <DashboardNav role={role} labels={navLabels} ariaLabel={navAriaLabel} variant="sidebar" />
      </div>

      <Link
        href={ROUTES.PROFILE.HREF}
        className="border-sidebar-border hover:bg-sidebar-accent/60 flex shrink-0 items-center gap-2.5 border-t p-4 transition-colors">
        <Avatar className="size-8">
          <AvatarFallback>{user.initials}</AvatarFallback>
        </Avatar>

        <span className="flex min-w-0 flex-col">
          <span className="text-sidebar-foreground truncate text-sm font-medium">{user.name}</span>
          <span className="text-muted-foreground truncate text-xs">{user.roleLabel}</span>
        </span>

        <span className="sr-only">{profileLabel}</span>
      </Link>
    </aside>
  );
}
