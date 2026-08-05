export const ROUTES = {
  // --- Main Pages ---
  HOME: {
    LABEL: 'Home',
    HREF: '/',
  },
} as const;

/*
  Anchors on the landing page. Dashboard routes (/sign-in, /admin, /teacher, /student)
  are deliberately absent until the authentication sprint creates them — `typedRoutes`
  turns a link to a non-existent route into a build error.

  Routes are stored unprefixed. `Link` from `@/l10n/navigation` adds the locale.
*/
export const SECTION_IDS = {
  ROLES: 'roles',
  FEATURES: 'features',
  STACK: 'stack',
  ROADMAP: 'roadmap',
} as const;
