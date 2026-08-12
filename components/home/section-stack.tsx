import { getTranslations } from 'next-intl/server';

import { SECTION_IDS, TECH_LABELS } from '@/constants';

import { Container } from '@/components/shared';

export async function SectionStack() {
  const l10n = await getTranslations();

  return (
    <section id={SECTION_IDS.STACK} className="border-border scroll-mt-16 border-t py-10">
      <Container className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg">{l10n('HOME_STACK_TITLE')}</h2>
          <p className="text-muted-foreground text-sm">{l10n('HOME_STACK_NOTE')}</p>
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          {[
            [TECH_LABELS.NEXTJS, l10n('HOME_STACK_NEXTJS_ROLE')],
            [TECH_LABELS.REACT, l10n('HOME_STACK_REACT_ROLE')],
            [TECH_LABELS.TYPESCRIPT, l10n('HOME_STACK_TYPESCRIPT_ROLE')],
            [TECH_LABELS.TAILWIND, l10n('HOME_STACK_TAILWIND_ROLE')],
            [TECH_LABELS.MONGODB, l10n('HOME_STACK_MONGODB_ROLE')],
            [TECH_LABELS.MONGOOSE, l10n('HOME_STACK_MONGOOSE_ROLE')],
          ].map(([label, role]) => (
            <div key={label} className="flex items-center gap-2">
              <dt className="font-semibold">{label}</dt>
              <dd className="text-muted-foreground">{role}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
