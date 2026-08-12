import { ArrowUpRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { SECTION_IDS, TECH_LABELS } from '@/constants';

import { Container } from '@/components/shared';

export async function SectionStack() {
  const l10n = await getTranslations();
  const technologies = [
    [TECH_LABELS.NEXTJS, l10n('HOME_STACK_NEXTJS_ROLE')],
    [TECH_LABELS.REACT, l10n('HOME_STACK_REACT_ROLE')],
    [TECH_LABELS.TYPESCRIPT, l10n('HOME_STACK_TYPESCRIPT_ROLE')],
    [TECH_LABELS.TAILWIND, l10n('HOME_STACK_TAILWIND_ROLE')],
    [TECH_LABELS.MONGODB, l10n('HOME_STACK_MONGODB_ROLE')],
    [TECH_LABELS.MONGOOSE, l10n('HOME_STACK_MONGOOSE_ROLE')],
  ] as const;

  return (
    <section id={SECTION_IDS.STACK} className="section-py scroll-mt-16">
      <Container>
        <div className="border-border bg-card overflow-hidden rounded-3xl border px-6 py-8 shadow-sm sm:px-9 sm:py-10 lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12 lg:px-12 lg:py-14">
          <div className="flex max-w-md flex-col items-start">
            <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase">
              Architecture
            </span>
            <h2 className="mt-5 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{l10n('HOME_STACK_TITLE')}</h2>
            <p className="text-muted-foreground mt-4 text-base leading-relaxed">{l10n('HOME_STACK_NOTE')}</p>
          </div>

          <dl className="border-border bg-border mt-8 grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-2 lg:mt-0 lg:grid-cols-3">
            {technologies.map(([label, role]) => (
              <div key={label} className="group bg-card hover:bg-muted min-h-32 p-5 transition-colors">
                <dt className="flex items-center justify-between gap-3 text-lg font-semibold">
                  {label}
                  <ArrowUpRight className="text-primary size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </dt>
                <dd className="text-muted-foreground mt-8 text-sm leading-relaxed">{role}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
