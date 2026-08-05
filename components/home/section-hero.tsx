import { getTranslations } from 'next-intl/server';

import { SECTION_IDS } from '@/constants';

import { Container } from '@/components/shared';
import { Button } from '@/components/ui';

import { HeroStat } from './hero-stat';

export async function SectionHero() {
  const l10n = await getTranslations();

  return (
    <section className="section-py relative overflow-hidden">
      {/* Ambient wash behind the headline */}
      <div aria-hidden className="bg-primary/10 pointer-events-none absolute -top-32 left-1/2 size-144 -translate-x-1/2 rounded-full blur-3xl" />

      <Container className="relative flex flex-col items-center gap-6 text-center">
        <span className="tagline border-border text-muted-foreground rounded-full border px-3 py-1">{l10n('HOME_HERO_EYEBROW')}</span>

        <h1 className="max-w-4xl text-balance">
          {l10n('HOME_HERO_TITLE_LEAD')} <span className="text-gradient-brand">{l10n('HOME_HERO_TITLE_HIGHLIGHT')}</span>
        </h1>

        <p className="text-medium-normal text-muted-foreground max-w-2xl text-pretty">{l10n('HOME_HERO_DESCRIPTION')}</p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="appPrimary" size="lg" nativeButton={false} render={<a href={`#${SECTION_IDS.ROLES}`} />}>
            {l10n('HOME_HERO_CTA_PRIMARY')}
          </Button>

          <Button variant="appOutline" size="lg" nativeButton={false} render={<a href={`#${SECTION_IDS.FEATURES}`} />}>
            {l10n('HOME_HERO_CTA_SECONDARY')}
          </Button>
        </div>

        <dl className="mt-4 grid w-full max-w-xl grid-cols-3 gap-4">
          <HeroStat value={l10n('HOME_HERO_STAT_ROLES_VALUE')} label={l10n('HOME_HERO_STAT_ROLES_LABEL')} />
          <HeroStat value={l10n('HOME_HERO_STAT_DEPARTMENT_VALUE')} label={l10n('HOME_HERO_STAT_DEPARTMENT_LABEL')} />
          <HeroStat value={l10n('HOME_HERO_STAT_WEEKS_VALUE')} label={l10n('HOME_HERO_STAT_WEEKS_LABEL')} />
        </dl>
      </Container>
    </section>
  );
}
