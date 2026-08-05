import {
  CalendarDays,
  FolderOpen,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  Megaphone,
  MonitorSmartphone,
  Presentation,
  ShieldCheck,
} from 'lucide-react';

import { FeatureVisual, RoleVisual } from '@/types';

/*
  Structural data only. Every string on the landing page is an `l10n('KEY')` call in
  the component that renders it — keys are never collected into arrays here, because
  i18n-ally only detects them in their literal call form.
*/

export const ROLE_VISUALS = {
  ADMIN: {
    icon: ShieldCheck,
    accentClassName: 'text-accent-violet',
    surfaceClassName: 'bg-accent-violet/10',
  },
  TEACHER: {
    icon: Presentation,
    accentClassName: 'text-accent-blue',
    surfaceClassName: 'bg-accent-blue/10',
  },
  STUDENT: {
    icon: GraduationCap,
    accentClassName: 'text-accent-teal',
    surfaceClassName: 'bg-accent-teal/10',
  },
} as const satisfies Record<string, RoleVisual>;

export const FEATURE_VISUALS = {
  AUTH: { icon: KeyRound, accentClassName: 'text-primary' },
  RBAC: { icon: ShieldCheck, accentClassName: 'text-accent-violet' },
  SCHEDULING: { icon: CalendarDays, accentClassName: 'text-accent-blue' },
  MATERIALS: { icon: FolderOpen, accentClassName: 'text-accent-teal' },
  NOTICES: { icon: Megaphone, accentClassName: 'text-accent-amber' },
  DASHBOARDS: { icon: LayoutDashboard, accentClassName: 'text-primary' },
} as const satisfies Record<string, FeatureVisual>;

/**
 * Product names. Proper nouns, so they stay out of the dictionary.
 */
export const TECH_LABELS = {
  NEXTJS: 'Next.js 16',
  REACT: 'React 19',
  TYPESCRIPT: 'TypeScript',
  TAILWIND: 'Tailwind CSS v4',
  MONGODB: 'MongoDB',
  MONGOOSE: 'Mongoose',
} as const;

export const TECH_NOTE_ICON = MonitorSmartphone;
