'use client';

import { LayoutDashboard } from 'lucide-react';

import { Link, usePathname } from '@/l10n/navigation';
import { UserRole } from '@/types';

import { ROLE_HOME } from '@/constants/routes.const';

import { cn } from '@/lib/utils';

type DashboardNavProps = {
  role: UserRole;
  navLabel: string;
  overviewLabel: string;
  className?: string;
};

/*
  A client component only so the active link can be derived from the real pathname.
  Hard-coding "overview is current" would start lying the moment step 7 adds a second
  entry underneath it.
*/
export function DashboardNav({ role, navLabel, overviewLabel, className }: DashboardNavProps) {
  const pathname = usePathname();
  const overviewHref = ROLE_HOME[role];

  return (
    <nav aria-label={navLabel} className={cn('flex gap-1', className)}>
      <Link
        href={overviewHref}
        aria-current={pathname === overviewHref ? 'page' : undefined}
        className={cn(
          'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          pathname === overviewHref
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
        )}>
        <LayoutDashboard className="size-4 shrink-0" />
        {overviewLabel}
      </Link>
    </nav>
  );
}
