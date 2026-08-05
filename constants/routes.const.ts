import { UserRole } from '@/types';

export const ROUTES = {
  // --- Main Pages ---
  HOME: {
    LABEL: 'Home',
    HREF: '/',
  },
  SIGN_IN: {
    LABEL: 'Sign in',
    HREF: '/sign-in',
  },
  UNAUTHORIZED: {
    LABEL: 'Not allowed',
    HREF: '/unauthorized',
  },

  // --- Role dashboards ---
  ADMIN: {
    LABEL: 'Administrator',
    HREF: '/admin',
  },
  ADMIN_USERS: {
    LABEL: 'Users',
    HREF: '/admin/users',
  },
  ADMIN_USERS_NEW: {
    LABEL: 'Create account',
    HREF: '/admin/users/new',
  },
  TEACHER: {
    LABEL: 'Teacher',
    HREF: '/teacher',
  },
  STUDENT: {
    LABEL: 'Student',
    HREF: '/student',
  },
} as const;

/**
 * Where each role lands after signing in, and the only area it may enter.
 */
export const ROLE_HOME = {
  admin: ROUTES.ADMIN.HREF,
  teacher: ROUTES.TEACHER.HREF,
  student: ROUTES.STUDENT.HREF,
} as const satisfies Record<UserRole, string>;

/*
  Route segments that require a session. One list, used twice: `proxy.ts` guards
  them and `seo.const.ts` disallows them in robots.txt. Keeping it single-sourced is
  what stops a route from being open to crawlers but unguarded, or the reverse.

  Stored unprefixed — the locale is added where it is needed.
*/
export const PROTECTED_SEGMENTS = ['/admin', '/teacher', '/student'] as const;

/*
  Anchors on the landing page.

  Routes are stored unprefixed. `Link` from `@/l10n/navigation` adds the locale.
*/
export const SECTION_IDS = {
  ROLES: 'roles',
  FEATURES: 'features',
  STACK: 'stack',
  ROADMAP: 'roadmap',
} as const;
