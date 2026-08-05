import { getTranslations } from 'next-intl/server';

import { SECTION_IDS } from '@/constants';

import { Container } from '@/components/shared';

import { RoadmapRow } from './roadmap-row';

export async function SectionRoadmap() {
  const l10n = await getTranslations();

  return (
    <section id={SECTION_IDS.ROADMAP} className="bg-muted/40 section-py scroll-mt-16">
      <Container className="flex flex-col gap-10">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className="tagline text-primary">{l10n('HOME_ROADMAP_TAGLINE')}</span>
          <h2>{l10n('HOME_ROADMAP_TITLE')}</h2>
          <p className="text-medium-normal text-muted-foreground text-pretty">{l10n('HOME_ROADMAP_DESCRIPTION')}</p>
        </div>

        <ol className="flex flex-col gap-3">
          <RoadmapRow
            phase={l10n('HOME_ROADMAP_PHASE_1_NAME')}
            activity={l10n('HOME_ROADMAP_PHASE_1_ACTIVITY')}
            duration={l10n('HOME_ROADMAP_PHASE_1_DURATION')}
          />
          <RoadmapRow
            phase={l10n('HOME_ROADMAP_PHASE_2_NAME')}
            activity={l10n('HOME_ROADMAP_PHASE_2_ACTIVITY')}
            duration={l10n('HOME_ROADMAP_PHASE_2_DURATION')}
          />
          <RoadmapRow
            phase={l10n('HOME_ROADMAP_PHASE_3_NAME')}
            activity={l10n('HOME_ROADMAP_PHASE_3_ACTIVITY')}
            duration={l10n('HOME_ROADMAP_PHASE_3_DURATION')}
          />
          <RoadmapRow
            phase={l10n('HOME_ROADMAP_PHASE_4_NAME')}
            activity={l10n('HOME_ROADMAP_PHASE_4_ACTIVITY')}
            duration={l10n('HOME_ROADMAP_PHASE_4_DURATION')}
          />
          <RoadmapRow
            phase={l10n('HOME_ROADMAP_PHASE_5_NAME')}
            activity={l10n('HOME_ROADMAP_PHASE_5_ACTIVITY')}
            duration={l10n('HOME_ROADMAP_PHASE_5_DURATION')}
          />
          <RoadmapRow
            phase={l10n('HOME_ROADMAP_PHASE_6_NAME')}
            activity={l10n('HOME_ROADMAP_PHASE_6_ACTIVITY')}
            duration={l10n('HOME_ROADMAP_PHASE_6_DURATION')}
          />
        </ol>
      </Container>
    </section>
  );
}
