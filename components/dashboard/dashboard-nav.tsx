'use client';

import { BookOpen, CalendarDays, FolderOpen, LayoutDashboard, UserRound, Users } from 'lucide-react';

import { Link, usePathname } from '@/l10n/navigation';
import { UserRole } from '@/types';

import { ADMIN_AREA_ROLES, USER_ROLES } from '@/constants/roles.const';
import { ROLE_HOME, ROUTES } from '@/constants/routes.const';

import { cn } from '@/lib/utils';

type DashboardNavProps = {
  role: UserRole;
  navLabel: string;
  overviewLabel: string;
  usersLabel: string;
  coursesLabel: string;
  scheduleLabel: string;
  materialsLabel: string;
  teachersLabel: string;
  profileLabel: string;
  className?: string;
};

/*
  A client component only so the active link can be derived from the real pathname.
  Hard-coding "overview is current" would start lying the moment a second entry lands
  underneath it — which is what step 7 did.
*/
export function DashboardNav({
  role,
  navLabel,
  overviewLabel,
  usersLabel,
  coursesLabel,
  scheduleLabel,
  materialsLabel,
  teachersLabel,
  profileLabel,
  className,
}: DashboardNavProps) {
  const pathname = usePathname();
  const overviewHref = ROLE_HOME[role];
  const usersHref = ROUTES.ADMIN_USERS.HREF;
  const coursesHref = ROUTES.ADMIN_COURSES.HREF;

  /*
    Every entry below asks whether this account is in the admin area rather than whether
    it is an administrator. The super administrator holds every administrator power, so
    a `role === ADMIN` test would take the Users and Courses links away from the one
    account that needs them most, and route it to the student timetable it cannot open.
  */
  const isAdminArea = ADMIN_AREA_ROLES.some(x => x === role);

  // The timetable exists for every role, at a different route each.
  const scheduleHref = isAdminArea
    ? ROUTES.ADMIN_SCHEDULE.HREF
    : role === USER_ROLES.TEACHER
      ? ROUTES.TEACHER_SCHEDULE.HREF
      : ROUTES.STUDENT_SCHEDULE.HREF;

  /*
    A teacher's repository and a student's reading list are the same files from opposite
    ends — one publishes, the other downloads. The admin area still has no equivalent.
  */
  const materialsHref = role === USER_ROLES.TEACHER ? ROUTES.TEACHER_MATERIALS.HREF : ROUTES.STUDENT_MATERIALS.HREF;

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

      {/* Accounts are the administrator's alone — nobody else may list the department. */}
      {isAdminArea && (
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

      {isAdminArea && (
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

      {!isAdminArea && (
        <Link
          href={materialsHref}
          aria-current={pathname.startsWith(materialsHref) ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname.startsWith(materialsHref)
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
          )}>
          <FolderOpen className="size-4 shrink-0" />
          {materialsLabel}
        </Link>
      )}

      {/* The directory answers a student's question; a teacher already has the staff list. */}
      {role === USER_ROLES.STUDENT && (
        <Link
          href={ROUTES.STUDENT_TEACHERS.HREF}
          aria-current={pathname.startsWith(ROUTES.STUDENT_TEACHERS.HREF) ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname.startsWith(ROUTES.STUDENT_TEACHERS.HREF)
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
          )}>
          <Users className="size-4 shrink-0" />
          {teachersLabel}
        </Link>
      )}

      {/*
        Last, and unconditional. Every role has one profile at one route — it is the only
        entry here that needs no test, because it is the only screen whose content is
        decided by who is looking rather than by which area they are allowed into.
      */}
      <Link
        href={ROUTES.PROFILE.HREF}
        aria-current={pathname.startsWith(ROUTES.PROFILE.HREF) ? 'page' : undefined}
        className={cn(
          'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          pathname.startsWith(ROUTES.PROFILE.HREF)
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
        )}>
        <UserRound className="size-4 shrink-0" />
        {profileLabel}
      </Link>
    </nav>
  );
}
