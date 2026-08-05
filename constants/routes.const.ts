import { NavItem } from '@/types';

export const ROUTES = {
  // --- Main Pages ---
  HOME: {
    LABEL: 'Home',
    HREF: '/',
  },
} as const;

/*
  Anchors on the landing page. Dashboard routes (/login, /admin, /teacher, /student)
  are deliberately absent until the authentication sprint creates them — `typedRoutes`
  turns a link to a non-existent route into a build error.
*/
export const SECTION_IDS = {
  ROLES: 'roles',
  FEATURES: 'features',
  STACK: 'stack',
  ROADMAP: 'roadmap',
} as const;

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Roles', href: `#${SECTION_IDS.ROLES}` },
  { label: 'Features', href: `#${SECTION_IDS.FEATURES}` },
  { label: 'Stack', href: `#${SECTION_IDS.STACK}` },
  { label: 'Roadmap', href: `#${SECTION_IDS.ROADMAP}` },
];
