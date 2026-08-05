import { APP_DATA, ROUTES } from '@/constants';
import { Link } from '@/l10n/navigation';
import { UserRole } from '@/types';

import { AppLogo } from '@/components/shared';

import { DashboardNav } from './dashboard-nav';

type DashboardSidebarProps = {
  role: UserRole;
  navLabel: string;
  overviewLabel: string;
  usersLabel: string;
};

/*
  Hidden below `lg`, where the same navigation runs across the topbar instead. One
  nav component, two placements — rather than two components that drift apart.
*/
export function DashboardSidebar({ role, navLabel, overviewLabel, usersLabel }: DashboardSidebarProps) {
  return (
    <aside className="bg-sidebar border-sidebar-border hidden w-60 shrink-0 flex-col gap-6 border-r p-4 lg:flex">
      <Link href={ROUTES.HOME.HREF} className="flex items-center gap-2.5 px-2">
        <AppLogo className="size-8" />
        <span className="font-heading text-regular-bold text-sidebar-foreground tracking-tight">{APP_DATA.SHORT_NAME}</span>
      </Link>

      <DashboardNav role={role} navLabel={navLabel} overviewLabel={overviewLabel} usersLabel={usersLabel} className="flex-col" />
    </aside>
  );
}
