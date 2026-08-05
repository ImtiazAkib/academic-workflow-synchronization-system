import { HERO } from '@/constants';

import { Container } from '@/components/shared';
import { Button } from '@/components/ui';

export function SectionHero() {
  return (
    <section className="section-py relative overflow-hidden">
      {/* Ambient wash behind the headline */}
      <div aria-hidden className="bg-primary/10 pointer-events-none absolute -top-32 left-1/2 size-144 -translate-x-1/2 rounded-full blur-3xl" />

      <Container className="relative flex flex-col items-center gap-6 text-center">
        <span className="tagline border-border text-muted-foreground rounded-full border px-3 py-1">{HERO.EYEBROW}</span>

        <h1 className="max-w-4xl text-balance">
          {HERO.TITLE_LEAD} <span className="text-gradient-brand">{HERO.TITLE_HIGHLIGHT}</span>
        </h1>

        <p className="text-medium-normal text-muted-foreground max-w-2xl text-pretty">{HERO.DESCRIPTION}</p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="appPrimary" size="lg" nativeButton={false} render={<a href={HERO.PRIMARY_CTA.HREF} />}>
            {HERO.PRIMARY_CTA.LABEL}
          </Button>

          <Button variant="appOutline" size="lg" nativeButton={false} render={<a href={HERO.SECONDARY_CTA.HREF} />}>
            {HERO.SECONDARY_CTA.LABEL}
          </Button>
        </div>

        <dl className="mt-4 grid w-full max-w-xl grid-cols-3 gap-4">
          {HERO.HIGHLIGHTS.map(highlight => (
            <div key={highlight.LABEL} className="surface-card flex flex-col items-center gap-1 px-4 py-5">
              <dt className="font-heading text-3xl font-bold tracking-tight">{highlight.VALUE}</dt>
              <dd className="text-muted-foreground text-sm">{highlight.LABEL}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
