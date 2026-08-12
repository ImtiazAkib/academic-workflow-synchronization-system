import { getTranslations } from 'next-intl/server';

import { SECTION_IDS } from '@/constants';

import { Container } from '@/components/shared';

export async function SectionRoadmap() {
  const l10n = await getTranslations();
  const moments = Array.from({ length: 6 }, (_, index) => ({
    time: l10n(`HOME_ROADMAP_PHASE_${index + 1}_NAME`),
    activity: l10n(`HOME_ROADMAP_PHASE_${index + 1}_ACTIVITY`),
    label: l10n(`HOME_ROADMAP_PHASE_${index + 1}_DURATION`),
  }));

  return (
    <section id={SECTION_IDS.ROADMAP} className="bg-muted/40 section-py scroll-mt-16">
      <Container className="flex flex-col gap-10">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className="tagline text-primary">{l10n('HOME_ROADMAP_TAGLINE')}</span>
          <h2>{l10n('HOME_ROADMAP_TITLE')}</h2>
          <p className="text-medium-normal text-muted-foreground text-pretty">{l10n('HOME_ROADMAP_DESCRIPTION')}</p>
        </div>

        <ol className="before:bg-border relative grid gap-4 before:absolute before:top-8 before:bottom-8 before:left-5 before:w-px md:gap-5 md:before:left-7">
          {moments.map(moment => (
            <li key={moment.time} className="relative pl-12 md:pl-16">
              <span className="border-background bg-primary absolute top-7 left-3 size-5 rounded-full border-4 shadow-sm md:left-5" />
              <article className="border-border bg-card grid overflow-hidden rounded-2xl border shadow-sm transition-transform duration-200 hover:-translate-y-0.5 md:grid-cols-[10rem_minmax(0,1fr)]">
                <div className="bg-primary/5 border-border flex items-center justify-between gap-3 border-b px-5 py-4 md:flex-col md:items-start md:justify-center md:border-r md:border-b-0">
                  <time className="text-primary text-2xl font-semibold tabular-nums">{moment.time}</time>
                  <span className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">{moment.label}</span>
                </div>
                <div className="flex items-center p-5">
                  <p className="text-muted-foreground text-sm leading-relaxed">{moment.activity}</p>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
