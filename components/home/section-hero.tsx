import { getTranslations } from 'next-intl/server';

import { SECTION_IDS } from '@/constants';

import { Container } from '@/components/shared';
import { Button } from '@/components/ui';

export async function SectionHero() {
  const l10n = await getTranslations();

  return (
    <section className="section-py">
      <Container className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
        <div className="flex flex-col items-start gap-5">
          <span className="tagline border-border text-muted-foreground rounded-full border px-3 py-1">{l10n('HOME_HERO_EYEBROW')}</span>

          <h1 className="max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            {l10n('HOME_HERO_TITLE_LEAD')} <span className="text-primary">{l10n('HOME_HERO_TITLE_HIGHLIGHT')}</span>
          </h1>

          <p className="text-muted-foreground max-w-xl text-lg leading-relaxed">{l10n('HOME_HERO_DESCRIPTION')}</p>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="default" size="lg" nativeButton={false} render={<a href={`#${SECTION_IDS.ROLES}`} />}>
              {l10n('HOME_HERO_CTA_PRIMARY')}
            </Button>

            <Button variant="outline" size="lg" nativeButton={false} render={<a href={`#${SECTION_IDS.FEATURES}`} />}>
              {l10n('HOME_HERO_CTA_SECONDARY')}
            </Button>
          </div>

          <p className="text-muted-foreground text-sm">
            {l10n('HOME_HERO_STAT_DEPARTMENT_VALUE')} {l10n('HOME_HERO_STAT_DEPARTMENT_LABEL')} · {l10n('HOME_HERO_STAT_ROLES_VALUE')}{' '}
            {l10n('HOME_HERO_STAT_ROLES_LABEL')}
          </p>
        </div>

        <aside className="border-border bg-card overflow-hidden rounded-xl border shadow-sm" aria-label={l10n('DASHBOARD_TODAY_SCHEDULE_TITLE')}>
          <div className="bg-primary text-primary-foreground flex items-center justify-between px-5 py-4">
            <span className="font-semibold">{l10n('DASHBOARD_TODAY_SCHEDULE_TITLE')}</span>
            <span className="text-xs opacity-80">{l10n('DASHBOARD_CLASS_NOW')}</span>
          </div>
          <div className="divide-border divide-y p-2">
            {[
              ['08:30', 'CSE 401', 'Algorithms'],
              ['10:00', 'CSE 403', 'Software Engineering'],
              ['14:30', 'CSE 405', 'Database Systems'],
            ].map(([time, code, title], index) => (
              <div key={code} className="flex items-center gap-3 p-3">
                <span className="text-muted-foreground w-10 text-xs tabular-nums">{time}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-semibold">{code}</span>
                  <span className="text-muted-foreground truncate text-xs">{title}</span>
                </span>
                {index === 0 && (
                  <span className="bg-success/10 text-success rounded-md px-2 py-1 text-xs font-medium">{l10n('DASHBOARD_CLASS_NOW')}</span>
                )}
              </div>
            ))}
          </div>
        </aside>
      </Container>
    </section>
  );
}
