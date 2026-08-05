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
} as const;

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
