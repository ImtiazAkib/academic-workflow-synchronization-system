import { getTranslations } from 'next-intl/server';

import { ROLE_VISUALS, SECTION_IDS } from '@/constants';

import { Container } from '@/components/shared';

import { RoleCard } from './role-card';

export async function SectionRoles() {
  const l10n = await getTranslations();

  return (
    <section id={SECTION_IDS.ROLES} className="section-py scroll-mt-16">
      <Container className="flex flex-col gap-10 lg:gap-12">
        <div className="flex max-w-3xl flex-col gap-3">
          <span className="tagline text-primary">{l10n('HOME_ROLES_TAGLINE')}</span>
          <h2>{l10n('HOME_ROLES_TITLE')}</h2>
          <p className="text-medium-normal text-muted-foreground text-pretty">{l10n('HOME_ROLES_DESCRIPTION')}</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <RoleCard
            visual={ROLE_VISUALS.ADMIN}
            title={l10n('HOME_ROLES_ADMIN_TITLE')}
            summary={l10n('HOME_ROLES_ADMIN_SUMMARY')}
            capabilities={[
              l10n('HOME_ROLES_ADMIN_CAPABILITY_1'),
              l10n('HOME_ROLES_ADMIN_CAPABILITY_2'),
              l10n('HOME_ROLES_ADMIN_CAPABILITY_3'),
              l10n('HOME_ROLES_ADMIN_CAPABILITY_4'),
            ]}
          />

          <RoleCard
            visual={ROLE_VISUALS.TEACHER}
            title={l10n('HOME_ROLES_TEACHER_TITLE')}
            summary={l10n('HOME_ROLES_TEACHER_SUMMARY')}
            capabilities={[
              l10n('HOME_ROLES_TEACHER_CAPABILITY_1'),
              l10n('HOME_ROLES_TEACHER_CAPABILITY_2'),
              l10n('HOME_ROLES_TEACHER_CAPABILITY_3'),
              l10n('HOME_ROLES_TEACHER_CAPABILITY_4'),
            ]}
          />

          <RoleCard
            visual={ROLE_VISUALS.STUDENT}
            title={l10n('HOME_ROLES_STUDENT_TITLE')}
            summary={l10n('HOME_ROLES_STUDENT_SUMMARY')}
            capabilities={[
              l10n('HOME_ROLES_STUDENT_CAPABILITY_1'),
              l10n('HOME_ROLES_STUDENT_CAPABILITY_2'),
              l10n('HOME_ROLES_STUDENT_CAPABILITY_3'),
              l10n('HOME_ROLES_STUDENT_CAPABILITY_4'),
            ]}
          />
        </div>
      </Container>
    </section>
  );
}
