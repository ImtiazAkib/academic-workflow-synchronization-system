import { BookOpen, CalendarDays, FolderOpen, LayoutDashboard, Megaphone, UploadCloud, Users } from 'lucide-react';

import { ADMIN_AREA_ROLES, USER_ROLES } from '@/constants/roles.const';
import { ROLE_HOME, ROUTES } from '@/constants/routes.const';

import type { UserRole } from '@/types';
import type { LucideIcon } from 'lucide-react';

export type NavItem = { href: string; icon: LucideIcon; label: string };
export type NavSection = { id: string; label: string | null; items: NavItem[] };
export type Crumb = { label: string; current: boolean };

export type NavLabels = {
  overview: string;
  users: string;
  courses: string;
  schedule: string;
  materials: string;
  teachers: string;
  notices: string;
  uploads: string;
  sectionAcademic: string;
  sectionCommunication: string;
  sectionDirectory: string;
  sectionAdministration: string;
};

/**
 * The dashboard navigation as data, grouped into the sections the redesign asks for
 * (Overview, then ACADEMIC / COMMUNICATION / DIRECTORY / ADMINISTRATION). One source for
 * three consumers — the sidebar, the breadcrumb and (later) the mobile drawer — so the three
 * cannot drift. Role visibility is decided here rather than at render: an entry a role cannot
 * reach is never in its model, so it is hidden entirely rather than disabled, and empty
 * sections drop out. Mirrors the access rules the old flat nav applied inline.
 *
 * @param role - The signed-in account's role.
 * @param labels - The already-translated item and section labels.
 *
 * @returns The visible sections for this role, empty sections removed.
 */
export function resolveNavModel(role: UserRole, labels: NavLabels): NavSection[] {
  const isAdminArea = ADMIN_AREA_ROLES.some(x => x === role);
  const isTeacher = role === USER_ROLES.TEACHER;
  const isStudent = role === USER_ROLES.STUDENT;

  const scheduleHref = isAdminArea ? ROUTES.ADMIN_SCHEDULE.HREF : isTeacher ? ROUTES.TEACHER_SCHEDULE.HREF : ROUTES.STUDENT_SCHEDULE.HREF;
  const coursesHref = isAdminArea ? ROUTES.ADMIN_COURSES.HREF : ROUTES.TEACHER_COURSES.HREF;
  const materialsHref = isTeacher ? ROUTES.TEACHER_MATERIALS.HREF : ROUTES.STUDENT_MATERIALS.HREF;
  const noticesHref = isAdminArea ? ROUTES.ADMIN_NOTICES.HREF : isTeacher ? ROUTES.TEACHER_NOTICES.HREF : ROUTES.STUDENT_NOTICES.HREF;
  const uploadsHref = isAdminArea ? ROUTES.ADMIN_UPLOADS.HREF : ROUTES.TEACHER_UPLOADS.HREF;

  const academic: NavItem[] = [{ href: scheduleHref, icon: CalendarDays, label: labels.schedule }];
  if (isAdminArea || isTeacher) academic.push({ href: coursesHref, icon: BookOpen, label: labels.courses });
  if (isTeacher || isStudent) academic.push({ href: materialsHref, icon: FolderOpen, label: labels.materials });
  if (isAdminArea || isTeacher) academic.push({ href: uploadsHref, icon: UploadCloud, label: labels.uploads });

  const communication: NavItem[] = [];
  communication.push({ href: noticesHref, icon: Megaphone, label: labels.notices });

  const directory: NavItem[] = [];
  if (isStudent) directory.push({ href: ROUTES.STUDENT_TEACHERS.HREF, icon: Users, label: labels.teachers });

  const administration: NavItem[] = [];
  if (isAdminArea) administration.push({ href: ROUTES.ADMIN_USERS.HREF, icon: Users, label: labels.users });

  const sections: NavSection[] = [
    { id: 'overview', label: null, items: [{ href: ROLE_HOME[role], icon: LayoutDashboard, label: labels.overview }] },
    { id: 'academic', label: labels.sectionAcademic, items: academic },
    { id: 'communication', label: labels.sectionCommunication, items: communication },
    { id: 'directory', label: labels.sectionDirectory, items: directory },
    { id: 'administration', label: labels.sectionAdministration, items: administration },
  ];

  return sections.filter(x => x.items.length > 0);
}

/**
 * Whether a nav entry is the current page. The overview entry matches its route exactly —
 * its href (`/admin`, `/teacher`, `/student`) is a prefix of every page in the area, so a
 * `startsWith` there would light it up everywhere. Every other entry also matches its own
 * sub-pages (`/admin/users/new` is still "Users").
 *
 * @param pathname - The locale-stripped current path.
 * @param href - The entry's route.
 * @param exact - True for the overview entry.
 *
 * @returns Whether the entry represents the current location.
 */
export function isNavItemActive(pathname: string, href: string, exact: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The topbar location trail for a path: the section it belongs to, then the page itself.
 * On an area home it collapses to the single Overview crumb. The section crumb is a label,
 * not a link — sections have no landing page of their own.
 *
 * @param pathname - The locale-stripped current path.
 * @param sections - The role's nav model.
 * @param overviewLabel - The label for the area home crumb.
 *
 * @returns The crumbs from section to current page.
 */
export function resolveBreadcrumbTrail(pathname: string, sections: NavSection[], overviewLabel: string): Crumb[] {
  const overviewHref = sections.find(x => x.id === 'overview')?.items[0]?.href;

  if (overviewHref && pathname === overviewHref) {
    return [{ label: overviewLabel, current: true }];
  }

  for (const section of sections) {
    if (section.id === 'overview') continue;

    for (const item of section.items) {
      if (isNavItemActive(pathname, item.href, false)) {
        const crumbs: Crumb[] = [];
        if (section.label) crumbs.push({ label: section.label, current: false });
        crumbs.push({ label: item.label, current: true });

        return crumbs;
      }
    }
  }

  return [{ label: overviewLabel, current: true }];
}

/**
 * Up-to-two-letter initials for an avatar fallback, since the department stores no photos.
 * One name gives its first two letters; two or more give the first letter of the first and
 * last. `Array.from` so a surrogate-pair first character is not sliced in half.
 *
 * @param name - The person's display name.
 *
 * @returns The uppercased initials, or `?` for an empty name.
 */
export function resolveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return Array.from(parts[0]).slice(0, 2).join('').toUpperCase();
  }

  return (Array.from(parts[0])[0] + Array.from(parts[parts.length - 1])[0]).toUpperCase();
}
