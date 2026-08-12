import { ArrowDownRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { SECTION_IDS } from '@/constants';

import { AppLogo, Container } from '@/components/shared';
import { Button } from '@/components/ui';

const classes = [
  ['08:30', 'CSE 401', 'Algorithms'],
  ['10:00', 'CSE 403', 'Software Engineering'],
  ['14:30', 'CSE 405', 'Database Systems'],
] as const;

export async function SectionHero() {
  const l10n = await getTranslations();

  return (
    <section className="section-py relative overflow-hidden lg:pt-20">
      <div className="bg-primary/8 pointer-events-none absolute top-0 left-1/2 -z-10 size-168 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
      <Container className="flex flex-col items-center gap-10 text-center lg:gap-14">
        <div className="flex max-w-4xl flex-col items-center gap-6">
          <div className="border-border bg-card flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm">
            <AppLogo className="size-6" />
            <span className="text-xs font-semibold tracking-[0.16em] uppercase">ASW academic ERP</span>
          </div>

          <h1 className="max-w-4xl text-4xl leading-[1.04] font-semibold tracking-[-0.045em] sm:text-5xl lg:text-7xl">
            {l10n('HOME_HERO_TITLE_LEAD')} <span className="text-primary">{l10n('HOME_HERO_TITLE_HIGHLIGHT')}</span>
          </h1>

          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">{l10n('HOME_HERO_DESCRIPTION')}</p>

          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="default" size="lg" nativeButton={false} render={<a href={`#${SECTION_IDS.ROLES}`} />}>
              {l10n('HOME_HERO_CTA_PRIMARY')}
              <ArrowDownRight className="size-4" />
            </Button>
            <Button variant="outline" size="lg" nativeButton={false} render={<a href={`#${SECTION_IDS.FEATURES}`} />}>
              {l10n('HOME_HERO_CTA_SECONDARY')}
            </Button>
          </div>

          <p className="text-muted-foreground text-sm">
            {l10n('HOME_HERO_STAT_DEPARTMENT_VALUE')} {l10n('HOME_HERO_STAT_DEPARTMENT_LABEL')} {'\u2022'} {l10n('HOME_HERO_STAT_ROLES_VALUE')}{' '}
            {l10n('HOME_HERO_STAT_ROLES_LABEL')}
          </p>
        </div>

        <aside
          className="border-border bg-card w-full max-w-5xl overflow-hidden rounded-3xl border p-2 shadow-2xl shadow-black/8"
          aria-label={l10n('DASHBOARD_TODAY_SCHEDULE_TITLE')}>
          <div className="border-border flex items-center justify-between border-b px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2.5">
              <AppLogo className="size-7" />
              <span className="text-sm font-semibold">ASW workspace</span>
            </div>
            <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold">Live today</span>
          </div>

          <div className="grid gap-4 p-3 text-left sm:p-5 md:grid-cols-[minmax(0,1.45fr)_minmax(13rem,0.8fr)]">
            <div className="border-border rounded-2xl border p-4 sm:p-5">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-xs font-medium">Tuesday, 12 August</p>
                  <h2 className="mt-1 text-xl font-semibold">Your academic flow</h2>
                </div>
                <span className="bg-primary/10 text-primary rounded-lg px-2.5 py-1.5 text-xs font-semibold">3 updates</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {classes.map(([time, code, title], index) => (
                  <div key={code} className="bg-muted/55 rounded-xl p-3">
                    <span className="text-primary text-sm font-semibold tabular-nums">{time}</span>
                    <span className="mt-5 block text-sm font-semibold">{code}</span>
                    <span className="text-muted-foreground block truncate text-xs">{title}</span>
                    {index === 0 && <span className="text-primary mt-3 block text-xs font-semibold">{l10n('DASHBOARD_CLASS_NOW')}</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-primary/20 bg-primary/12 text-foreground dark:border-primary/25 dark:bg-primary/10 flex flex-col justify-between rounded-2xl border p-5">
              <div>
                <span className="bg-primary/15 text-primary dark:bg-primary/20 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold">
                  Connected
                </span>
                <h2 className="mt-6 text-xl leading-snug font-semibold">Every update reaches the right person.</h2>
              </div>
              <div className="border-primary/15 text-muted-foreground dark:border-primary/20 mt-8 border-t pt-4 text-sm">
                <span className="text-foreground font-semibold">Material shared</span>
                <span className="mt-1 block">Ready for students</span>
              </div>
            </div>
          </div>
        </aside>
      </Container>
    </section>
  );
}
