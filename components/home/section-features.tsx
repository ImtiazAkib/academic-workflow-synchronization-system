import { FEATURES, SECTION_IDS } from '@/constants';

import { Container } from '@/components/shared';

import { FeatureCard } from './feature-card';

export function SectionFeatures() {
  return (
    <section id={SECTION_IDS.FEATURES} className="bg-muted/40 section-py scroll-mt-16">
      <Container className="flex flex-col gap-10">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className="tagline text-primary">Core functionality</span>
          <h2>What the system does</h2>
          <p className="text-medium-normal text-muted-foreground text-pretty">
            Scheduling, materials and notices are the three things a department loses time on. Each one becomes a single source of truth.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(item => (
            <FeatureCard key={item.title} item={item} />
          ))}
        </div>
      </Container>
    </section>
  );
}
