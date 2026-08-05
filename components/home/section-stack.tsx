import { SECTION_IDS, TECH_NOTE, TECH_STACK } from '@/constants';

import { Container } from '@/components/shared';

export function SectionStack() {
  const NoteIcon = TECH_NOTE.ICON;

  return (
    <section id={SECTION_IDS.STACK} className="section-py scroll-mt-16">
      <Container className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
        <div className="flex max-w-md flex-col gap-3">
          <span className="tagline text-primary">Technology</span>
          <h2>Built on the MERN stack</h2>
          <p className="text-medium-normal text-muted-foreground text-pretty">
            Next.js handles rendering and the API layer in one codebase. MongoDB stores the document-shaped data a department actually has — profiles,
            courses and nested course structures.
          </p>

          <p className="text-muted-foreground mt-2 flex items-start gap-2.5 text-sm">
            <NoteIcon className="text-primary mt-0.5 size-4 shrink-0" />
            <span>{TECH_NOTE.TEXT}</span>
          </p>
        </div>

        <dl className="grid flex-1 gap-4 sm:grid-cols-2">
          {TECH_STACK.map(item => (
            <div key={item.label} className="surface-card flex flex-col gap-1 p-5">
              <dt className="text-regular-semibold">{item.label}</dt>
              <dd className="text-muted-foreground text-sm">{item.role}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
