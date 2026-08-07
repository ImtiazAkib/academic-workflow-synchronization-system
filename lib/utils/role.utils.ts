import { UserRole } from '@/types';

import { USER_ROLES } from '@/constants/roles.const';

// Type-only: `next-intl/server` reaches for `next/headers`, which a client bundle
// cannot resolve. Only the translator's shape is needed here.
import type { getTranslations } from 'next-intl/server';

type Translator = Awaited<ReturnType<typeof getTranslations>>;

/**
 * The label a role is shown under.
 *
 * Written as four literal `l10n('KEY')` calls rather than a role-to-key map, because
 * the editor integration only finds keys in their literal call form.
 *
 * @param role - The role to label.
 * @param l10n - Translator from the calling server component.
 *
 * @returns The translated role name.
 */
export function resolveRoleLabel(role: UserRole, l10n: Translator): string {
  if (role === USER_ROLES.SUPER_ADMIN) {
    return l10n('ROLE_SUPER_ADMIN_LABEL');
  }

  if (role === USER_ROLES.ADMIN) {
    return l10n('ROLE_ADMIN_LABEL');
  }

  if (role === USER_ROLES.TEACHER) {
    return l10n('ROLE_TEACHER_LABEL');
  }

  return l10n('ROLE_STUDENT_LABEL');
}
