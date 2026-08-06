'use client';

import { BookOpen, CalendarDays, LayoutDashboard, Users } from 'lucide-react';

import { Link, usePathname } from '@/l10n/navigation';
import { UserRole } from '@/types';

import { USER_ROLES } from '@/constants/roles.const';
import { ROLE_HOME, ROUTES } from '@/constants/routes.const';

import { cn } from '@/lib/utils';

type DashboardNavProps = {
  role: UserRole;
  navLabel: string;
  overviewLabel: string;
  usersLabel: string;
  coursesLabel: string;
  scheduleLabel: string;
  className?: string;
};

/*
  A client component only so the active link can be derived from the real pathname.
  Hard-coding "overview is current" would start lying the moment a second entry lands
  underneath it — which is what step 7 did.
*/
export function DashboardNav({ role, navLabel, overviewLabel, usersLabel, coursesLabel, scheduleLabel, className }: DashboardNavProps) {
  const pathname = usePathname();
  const overviewHref = ROLE_HOME[role];
  const usersHref = ROUTES.ADMIN_USERS.HREF;
  const coursesHref = ROUTES.ADMIN_COURSES.HREF;

  // The timetable exists for both roles, at a different route each.
  const scheduleHref = role === USER_ROLES.ADMIN ? ROUTES.ADMIN_SCHEDULE.HREF : ROUTES.TEACHER_SCHEDULE.HREF;

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

      {/* Only the administrator has anything under the overview so far. */}
      {role === USER_ROLES.ADMIN && (
        <Link
          href={usersHref}
          aria-current={pathname === usersHref ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname === usersHref
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
          )}>
          <Users className="size-4 shrink-0" />
          {usersLabel}
        </Link>
      )}

      {role === USER_ROLES.ADMIN && (
        <Link
          href={coursesHref}
          aria-current={pathname.startsWith(coursesHref) ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname.startsWith(coursesHref)
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
          )}>
          <BookOpen className="size-4 shrink-0" />
          {coursesLabel}
        </Link>
      )}

      {role !== USER_ROLES.STUDENT && (
        <Link
          href={scheduleHref}
          aria-current={pathname.startsWith(scheduleHref) ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname.startsWith(scheduleHref)
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
          )}>
          <CalendarDays className="size-4 shrink-0" />
          {scheduleLabel}
        </Link>
      )}
    </nav>
  );
}
