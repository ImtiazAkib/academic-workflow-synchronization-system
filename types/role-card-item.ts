import { LucideIcon } from 'lucide-react';

import { UserRole } from './user-role';

export type RoleCardItem = {
  role: UserRole;
  title: string;
  summary: string;
  capabilities: readonly string[];
  icon: LucideIcon;
  accentClassName: string;
  surfaceClassName: string;
};
