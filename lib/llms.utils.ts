import { getTranslations } from 'next-intl/server';

import { APP_DATA } from '@/constants';

type Translator = Awaited<ReturnType<typeof getTranslations>>;

type LlmsInput = {
  l10n: Translator;
  homeUrl: string;
  banglaUrl: string;
};

/*
  Both documents are built from the same dictionary keys the page renders, so they
  cannot drift from the UI the way a hand-maintained text file would.
*/

function buildHeader({ l10n, homeUrl, banglaUrl }: LlmsInput): string[] {
  return [`# ${APP_DATA.NAME}`, '', `> ${l10n('APP_METADATA_DESCRIPTION')}`, '', `Home: ${homeUrl}`, `Bangla (বাংলা): ${banglaUrl}`, ''];
}

/**
 * The short index, per the llmstxt.org convention.
 *
 * @param input - Translator and absolute URLs.
 *
 * @returns Markdown document.
 */
export function buildLlmsTxt(input: LlmsInput): string {
  const { l10n, homeUrl } = input;

  return [
    ...buildHeader(input),
    '## What it is',
    '',
    `${l10n('HOME_HERO_DESCRIPTION')}`,
    '',
    '## Roles',
    '',
    `- **${l10n('HOME_ROLES_ADMIN_TITLE')}** — ${l10n('HOME_ROLES_ADMIN_SUMMARY')}`,
    `- **${l10n('HOME_ROLES_TEACHER_TITLE')}** — ${l10n('HOME_ROLES_TEACHER_SUMMARY')}`,
    `- **${l10n('HOME_ROLES_STUDENT_TITLE')}** — ${l10n('HOME_ROLES_STUDENT_SUMMARY')}`,
    '',
    '## Features',
    '',
    `- **${l10n('HOME_FEATURES_AUTH_TITLE')}** — ${l10n('HOME_FEATURES_AUTH_DESCRIPTION')}`,
    `- **${l10n('HOME_FEATURES_RBAC_TITLE')}** — ${l10n('HOME_FEATURES_RBAC_DESCRIPTION')}`,
    `- **${l10n('HOME_FEATURES_SCHEDULING_TITLE')}** — ${l10n('HOME_FEATURES_SCHEDULING_DESCRIPTION')}`,
    `- **${l10n('HOME_FEATURES_MATERIALS_TITLE')}** — ${l10n('HOME_FEATURES_MATERIALS_DESCRIPTION')}`,
    `- **${l10n('HOME_FEATURES_NOTICES_TITLE')}** — ${l10n('HOME_FEATURES_NOTICES_DESCRIPTION')}`,
    `- **${l10n('HOME_FEATURES_DASHBOARDS_TITLE')}** — ${l10n('HOME_FEATURES_DASHBOARDS_DESCRIPTION')}`,
    '',
    '## Optional',
    '',
    `- Full description: ${homeUrl}llms-full.txt`,
    '',
  ].join('\n');
}

/**
 * The long form — every section of the landing page as markdown.
 *
 * @param input - Translator and absolute URLs.
 *
 * @returns Markdown document.
 */
export function buildLlmsFullTxt(input: LlmsInput): string {
  const { l10n } = input;

  return [
    ...buildHeader(input),
    `## ${l10n('HOME_HERO_TITLE_LEAD')} ${l10n('HOME_HERO_TITLE_HIGHLIGHT')}`,
    '',
    l10n('HOME_HERO_DESCRIPTION'),
    '',
    `## ${l10n('HOME_ROLES_TITLE')}`,
    '',
    l10n('HOME_ROLES_DESCRIPTION'),
    '',
    `### ${l10n('HOME_ROLES_ADMIN_TITLE')}`,
    '',
    l10n('HOME_ROLES_ADMIN_SUMMARY'),
    '',
    `- ${l10n('HOME_ROLES_ADMIN_CAPABILITY_1')}`,
    `- ${l10n('HOME_ROLES_ADMIN_CAPABILITY_2')}`,
    `- ${l10n('HOME_ROLES_ADMIN_CAPABILITY_3')}`,
    `- ${l10n('HOME_ROLES_ADMIN_CAPABILITY_4')}`,
    '',
    `### ${l10n('HOME_ROLES_TEACHER_TITLE')}`,
    '',
    l10n('HOME_ROLES_TEACHER_SUMMARY'),
    '',
    `- ${l10n('HOME_ROLES_TEACHER_CAPABILITY_1')}`,
    `- ${l10n('HOME_ROLES_TEACHER_CAPABILITY_2')}`,
    `- ${l10n('HOME_ROLES_TEACHER_CAPABILITY_3')}`,
    `- ${l10n('HOME_ROLES_TEACHER_CAPABILITY_4')}`,
    '',
    `### ${l10n('HOME_ROLES_STUDENT_TITLE')}`,
    '',
    l10n('HOME_ROLES_STUDENT_SUMMARY'),
    '',
    `- ${l10n('HOME_ROLES_STUDENT_CAPABILITY_1')}`,
    `- ${l10n('HOME_ROLES_STUDENT_CAPABILITY_2')}`,
    `- ${l10n('HOME_ROLES_STUDENT_CAPABILITY_3')}`,
    `- ${l10n('HOME_ROLES_STUDENT_CAPABILITY_4')}`,
    '',
    `## ${l10n('HOME_FEATURES_TITLE')}`,
    '',
    l10n('HOME_FEATURES_DESCRIPTION'),
    '',
    `- **${l10n('HOME_FEATURES_AUTH_TITLE')}** — ${l10n('HOME_FEATURES_AUTH_DESCRIPTION')}`,
    `- **${l10n('HOME_FEATURES_RBAC_TITLE')}** — ${l10n('HOME_FEATURES_RBAC_DESCRIPTION')}`,
    `- **${l10n('HOME_FEATURES_SCHEDULING_TITLE')}** — ${l10n('HOME_FEATURES_SCHEDULING_DESCRIPTION')}`,
    `- **${l10n('HOME_FEATURES_MATERIALS_TITLE')}** — ${l10n('HOME_FEATURES_MATERIALS_DESCRIPTION')}`,
    `- **${l10n('HOME_FEATURES_NOTICES_TITLE')}** — ${l10n('HOME_FEATURES_NOTICES_DESCRIPTION')}`,
    `- **${l10n('HOME_FEATURES_DASHBOARDS_TITLE')}** — ${l10n('HOME_FEATURES_DASHBOARDS_DESCRIPTION')}`,
    '',
    `## ${l10n('HOME_STACK_TITLE')}`,
    '',
    l10n('HOME_STACK_DESCRIPTION'),
    '',
    l10n('HOME_STACK_NOTE'),
    '',
    `## ${l10n('HOME_ROADMAP_TITLE')}`,
    '',
    l10n('HOME_ROADMAP_DESCRIPTION'),
    '',
    `- ${l10n('HOME_ROADMAP_PHASE_1_NAME')} (${l10n('HOME_ROADMAP_PHASE_1_DURATION')}) — ${l10n('HOME_ROADMAP_PHASE_1_ACTIVITY')}`,
    `- ${l10n('HOME_ROADMAP_PHASE_2_NAME')} (${l10n('HOME_ROADMAP_PHASE_2_DURATION')}) — ${l10n('HOME_ROADMAP_PHASE_2_ACTIVITY')}`,
    `- ${l10n('HOME_ROADMAP_PHASE_3_NAME')} (${l10n('HOME_ROADMAP_PHASE_3_DURATION')}) — ${l10n('HOME_ROADMAP_PHASE_3_ACTIVITY')}`,
    `- ${l10n('HOME_ROADMAP_PHASE_4_NAME')} (${l10n('HOME_ROADMAP_PHASE_4_DURATION')}) — ${l10n('HOME_ROADMAP_PHASE_4_ACTIVITY')}`,
    `- ${l10n('HOME_ROADMAP_PHASE_5_NAME')} (${l10n('HOME_ROADMAP_PHASE_5_DURATION')}) — ${l10n('HOME_ROADMAP_PHASE_5_ACTIVITY')}`,
    `- ${l10n('HOME_ROADMAP_PHASE_6_NAME')} (${l10n('HOME_ROADMAP_PHASE_6_DURATION')}) — ${l10n('HOME_ROADMAP_PHASE_6_ACTIVITY')}`,
    '',
  ].join('\n');
}
