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

import { FeatureItem, PhaseItem, RoleCardItem, TechItem } from '@/types';

import { USER_ROLES } from './roles.const';
import { SECTION_IDS } from './routes.const';

export const HERO = {
  EYEBROW: 'Departmental ERP',
  TITLE_LEAD: 'Every academic workflow,',
  TITLE_HIGHLIGHT: 'synchronized',
  DESCRIPTION:
    'Schedules live in spreadsheets, materials arrive by email and flash drive, notices never reach everyone. This system replaces all three with one platform — role-based, responsive and built for a single department.',
  PRIMARY_CTA: {
    LABEL: 'See the roles',
    HREF: `#${SECTION_IDS.ROLES}`,
  },
  SECONDARY_CTA: {
    LABEL: 'Core features',
    HREF: `#${SECTION_IDS.FEATURES}`,
  },
  HIGHLIGHTS: [
    { VALUE: '3', LABEL: 'User roles' },
    { VALUE: '1', LABEL: 'Department' },
    { VALUE: '8', LABEL: 'Week build' },
  ],
} as const;

export const ROLE_CARDS: readonly RoleCardItem[] = [
  {
    role: USER_ROLES.ADMIN,
    title: 'Administrator',
    summary: 'Full control over the department — accounts, timetable and announcements.',
    capabilities: [
      'Create and approve teacher and student accounts',
      'Set class times, rooms and assigned teachers',
      'Resolve room and time conflicts before they ship',
      'Publish department-wide announcements',
    ],
    icon: ShieldCheck,
    accentClassName: 'text-accent-violet',
    surfaceClassName: 'bg-accent-violet/10',
  },
  {
    role: USER_ROLES.TEACHER,
    title: 'Teacher',
    summary: 'A personal dashboard for the classes taught and the material behind them.',
    capabilities: [
      'View the assigned class schedule at a glance',
      'Upload lecture slides, PDFs and assignments',
      'Organize material by course code and subject',
      'Maintain a public profile and contact details',
    ],
    icon: Presentation,
    accentClassName: 'text-accent-blue',
    surfaceClassName: 'bg-accent-blue/10',
  },
  {
    role: USER_ROLES.STUDENT,
    title: 'Student',
    summary: 'One place for the routine, the notices and every file a course provides.',
    capabilities: [
      'Read the class routine for the current semester',
      'Download materials the moment they are posted',
      'Follow department notices without chasing them',
      'Look up teacher profiles and contact info',
    ],
    icon: GraduationCap,
    accentClassName: 'text-accent-teal',
    surfaceClassName: 'bg-accent-teal/10',
  },
];

export const FEATURES: readonly FeatureItem[] = [
  {
    icon: KeyRound,
    title: 'Authentication',
    description: 'Secure sign-in with encrypted passwords and session tokens, issued per account.',
    accentClassName: 'text-primary',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    description: 'Every route and action is gated by role, so a teacher never sees an admin screen.',
    accentClassName: 'text-accent-violet',
  },
  {
    icon: CalendarDays,
    title: 'Class scheduling',
    description: 'A calendar and grid view of the timetable, filterable by semester or teacher.',
    accentClassName: 'text-accent-blue',
  },
  {
    icon: FolderOpen,
    title: 'Materials repository',
    description: 'Slides, PDFs and assignments filed under the course code they belong to.',
    accentClassName: 'text-accent-teal',
  },
  {
    icon: Megaphone,
    title: 'Notices',
    description: 'Department announcements land on the dashboard of everyone they concern.',
    accentClassName: 'text-accent-amber',
  },
  {
    icon: LayoutDashboard,
    title: 'Tailored dashboards',
    description: 'Each role opens on the view it actually needs, not a generic landing screen.',
    accentClassName: 'text-primary',
  },
];

export const TECH_STACK: readonly TechItem[] = [
  { label: 'Next.js 16', role: 'App Router, server rendering, API routes' },
  { label: 'React 19', role: 'UI, hooks and Context for shared state' },
  { label: 'TypeScript', role: 'Strict types across the whole codebase' },
  { label: 'Tailwind CSS v4', role: 'Design tokens and responsive layout' },
  { label: 'MongoDB', role: 'Document store for profiles and courses' },
  { label: 'Mongoose', role: 'Schemas, validation and connection pooling' },
];

export const TECH_NOTE = {
  ICON: MonitorSmartphone,
  TEXT: 'Server-rendered and responsive from the first commit — the same dashboards work on a phone in a corridor and a desktop in the department office.',
} as const;

export const ROADMAP: readonly PhaseItem[] = [
  { phase: 'Phase 1', activity: 'Requirement analysis and UI/UX design', duration: 'Week 1' },
  { phase: 'Phase 2', activity: 'Database schema design and authentication setup', duration: 'Week 2' },
  { phase: 'Phase 3', activity: 'Admin dashboard and user management', duration: 'Week 3-4' },
  { phase: 'Phase 4', activity: 'Scheduling system and teacher dashboard', duration: 'Week 5-6' },
  { phase: 'Phase 5', activity: 'Student dashboard and material management', duration: 'Week 7' },
  { phase: 'Phase 6', activity: 'Testing, bug fixing and final deployment', duration: 'Week 8' },
];
