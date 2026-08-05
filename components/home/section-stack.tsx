import { getTranslations } from 'next-intl/server';

import { SECTION_IDS, TECH_LABELS, TECH_NOTE_ICON } from '@/constants';

import { Container } from '@/components/shared';

import { TechCard } from './tech-card';

export async function SectionStack() {
  const l10n = await getTranslations();

  const NoteIcon = TECH_NOTE_ICON;

  return (
    <section id={SECTION_IDS.STACK} className="section-py scroll-mt-16">
      <Container className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
        <div className="flex max-w-md flex-col gap-3">
          <span className="tagline text-primary">{l10n('HOME_STACK_TAGLINE')}</span>
          <h2>{l10n('HOME_STACK_TITLE')}</h2>
          <p className="text-medium-normal text-muted-foreground text-pretty">{l10n('HOME_STACK_DESCRIPTION')}</p>

          <p className="text-muted-foreground mt-2 flex items-start gap-2.5 text-sm">
            <NoteIcon className="text-primary mt-0.5 size-4 shrink-0" />
            <span>{l10n('HOME_STACK_NOTE')}</span>
          </p>
        </div>

        <dl className="grid flex-1 gap-4 sm:grid-cols-2">
          <TechCard label={TECH_LABELS.NEXTJS} role={l10n('HOME_STACK_NEXTJS_ROLE')} />
          <TechCard label={TECH_LABELS.REACT} role={l10n('HOME_STACK_REACT_ROLE')} />
          <TechCard label={TECH_LABELS.TYPESCRIPT} role={l10n('HOME_STACK_TYPESCRIPT_ROLE')} />
          <TechCard label={TECH_LABELS.TAILWIND} role={l10n('HOME_STACK_TAILWIND_ROLE')} />
          <TechCard label={TECH_LABELS.MONGODB} role={l10n('HOME_STACK_MONGODB_ROLE')} />
          <TechCard label={TECH_LABELS.MONGOOSE} role={l10n('HOME_STACK_MONGOOSE_ROLE')} />
        </dl>
      </Container>
    </section>
  );
}
