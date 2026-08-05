import { ROLE_CARDS, SECTION_IDS } from '@/constants';

import { Container } from '@/components/shared';

import { RoleCard } from './role-card';

export function SectionRoles() {
  return (
    <section id={SECTION_IDS.ROLES} className="section-py scroll-mt-16">
      <Container className="flex flex-col gap-10">
        <div className="flex max-w-2xl flex-col gap-3">
          <span className="tagline text-primary">User modules</span>
          <h2>Three roles, three dashboards</h2>
          <p className="text-medium-normal text-muted-foreground text-pretty">
            Access is decided by role, not by convention. Each account opens on the screens it is allowed to use, and nothing else.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ROLE_CARDS.map(item => (
            <RoleCard key={item.role} item={item} />
          ))}
        </div>
      </Container>
    </section>
  );
}
