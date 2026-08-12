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
  REGISTER: {
    LABEL: 'Register',
    HREF: '/register',
  },
  REGISTER_STUDENT: {
    LABEL: 'Register as a student',
    HREF: '/register/student',
  },
  REGISTER_TEACHER: {
    LABEL: 'Register as a teacher',
    HREF: '/register/teacher',
  },
  REGISTRATION_RECEIVED: {
    LABEL: 'Check your inbox',
    HREF: '/registration-received',
  },
  RESEND_CONFIRMATION: {
    LABEL: 'Resend confirmation',
    HREF: '/resend-confirmation',
  },
  VERIFY_EMAIL: {
    LABEL: 'Confirm your email',
    HREF: '/verify-email',
  },
  /*
    A second confirmation route rather than a query parameter on the first. The two links
    arrive at the same kind of moment and do entirely different things: one mints an
    identifier for an account that has none, the other moves the address on an account
    that is already in use. One route deciding between them by inspecting the token is a
    route that can pick wrong - and picking wrong here means issuing an identifier
    against an email change, or applying an email change against a registration.

    Public, and it has to be: the link is clicked from an inbox, which is as often a
    phone with no session as the browser that asked for the change.
  */
  VERIFY_EMAIL_CHANGE: {
    LABEL: 'Confirm your new address',
    HREF: '/verify-email-change',
  },
  /*
    Password recovery, in two halves like email verification: one screen asks for the
    address and mails a link, the other takes the link and sets a new password. Both are
    public - a locked-out account has no session, and the reset link is opened from an
    inbox as often on a phone that never signed in as in the browser that asked. Neither
    belongs in `PROTECTED_SEGMENTS`.
  */
  FORGOT_PASSWORD: {
    LABEL: 'Forgot password',
    HREF: '/forgot-password',
  },
  RESET_PASSWORD: {
    LABEL: 'Reset password',
    HREF: '/reset-password',
  },

  // --- The account somebody owns ---
  PROFILE: {
    LABEL: 'My profile',
    HREF: '/profile',
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
  ADMIN_COURSES: {
    LABEL: 'Courses',
    HREF: '/admin/courses',
  },
  ADMIN_COURSES_NEW: {
    LABEL: 'Create course',
    HREF: '/admin/courses/new',
  },
  ADMIN_NOTICES: {
    LABEL: 'Notices',
    HREF: '/admin/notices',
  },
  ADMIN_NOTICES_NEW: {
    LABEL: 'Publish a notice',
    HREF: '/admin/notices/new',
  },
  ADMIN_UPLOADS: {
    LABEL: 'Uploads',
    HREF: '/admin/uploads',
  },
  ADMIN_SCHEDULE: {
    LABEL: 'Schedule',
    HREF: '/admin/schedule',
  },
  ADMIN_SCHEDULE_NEW: {
    LABEL: 'Add class',
    HREF: '/admin/schedule/new',
  },
  TEACHER_SCHEDULE: {
    LABEL: 'My schedule',
    HREF: '/teacher/schedule',
  },
  TEACHER_COURSES: {
    LABEL: 'My courses',
    HREF: '/teacher/courses',
  },
  TEACHER_MATERIALS: {
    LABEL: 'Materials',
    HREF: '/teacher/materials',
  },
  TEACHER_NOTICES: {
    LABEL: 'Notices',
    HREF: '/teacher/notices',
  },
  TEACHER_NOTICES_NEW: {
    LABEL: 'Publish a notice',
    HREF: '/teacher/notices/new',
  },
  TEACHER_UPLOADS: {
    LABEL: 'Uploads',
    HREF: '/teacher/uploads',
  },
  TEACHER: {
    LABEL: 'Teacher',
    HREF: '/teacher',
  },
  STUDENT: {
    LABEL: 'Student',
    HREF: '/student',
  },
  STUDENT_SCHEDULE: {
    LABEL: 'My routine',
    HREF: '/student/schedule',
  },
  STUDENT_MATERIALS: {
    LABEL: 'Materials',
    HREF: '/student/materials',
  },
  STUDENT_TEACHERS: {
    LABEL: 'Teachers',
    HREF: '/student/teachers',
  },
} as const;

/**
 * Where each role lands after signing in, and the only area it may enter.
 */
export const ROLE_HOME = {
  // The super administrator lands in the admin area - it is their area too, with more in it.
  'super-admin': ROUTES.ADMIN.HREF,
  admin: ROUTES.ADMIN.HREF,
  teacher: ROUTES.TEACHER.HREF,
  student: ROUTES.STUDENT.HREF,
} as const satisfies Record<UserRole, string>;

/*
  Route segments that require a session. One list, used twice: `proxy.ts` guards
  them and `seo.const.ts` disallows them in robots.txt. Keeping it single-sourced is
  what stops a route from being open to crawlers but unguarded, or the reverse.

  Stored unprefixed - the locale is added where it is needed.

  `/profile` is listed explicitly because it is the one signed-in route that sits outside
  a role's own area - every other protected path begins with `/admin`, `/teacher` or
  `/student`, and would be covered by one of those prefixes whether anybody remembered it
  or not. This one would not.
*/
export const PROTECTED_SEGMENTS = ['/admin', '/teacher', '/student', '/profile'] as const;

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
