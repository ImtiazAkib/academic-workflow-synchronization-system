import { ROADMAP, SECTION_IDS } from '@/constants';

import { Container } from '@/components/shared';

export function SectionRoadmap() {
  return (
    <section id={SECTION_IDS.ROADMAP} className="bg-muted/40 section-py scroll-mt-16">
      <Container className="flex flex-col gap-10">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className="tagline text-primary">Timeline</span>
          <h2>Eight weeks, six phases</h2>
          <p className="text-medium-normal text-muted-foreground text-pretty">
            The build follows the sprints set out in the proposal — authentication first, deployment last.
          </p>
        </div>

        <ol className="flex flex-col gap-3">
          {ROADMAP.map(item => (
            <li key={item.phase} className="surface-card flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                <span className="text-primary text-regular-semibold w-20 shrink-0">{item.phase}</span>
                <span className="text-regular-normal">{item.activity}</span>
              </div>

              <span className="bg-secondary text-secondary-foreground w-fit rounded-full px-3 py-1 text-xs font-medium">{item.duration}</span>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
