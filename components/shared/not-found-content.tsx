import { ROUTES } from '@/constants';
import { Link } from '@/l10n/navigation';

import { Button } from '@/components/ui';

import { Container } from './container';

type NotFoundContentProps = {
  title: string;
  description: string;
  ctaLabel: string;
};

/*
  Shared by the two not-found boundaries: the one inside `(marketing)`, which inherits
  the site header, and the one at the locale root, which catches an invalid locale
  before any group layout has run.
*/
export function NotFoundContent({ title, description, ctaLabel }: NotFoundContentProps) {
  return (
    <section className="flex min-h-[60dvh] items-center">
      <Container className="flex flex-col items-center gap-6 text-center">
        <span className="text-gradient-brand font-heading text-7xl font-bold">404</span>

        <h2>{title}</h2>

        <p className="text-medium-normal text-muted-foreground max-w-xl">{description}</p>

        <Button variant="default" size="lg" nativeButton={false} render={<Link href={ROUTES.HOME.HREF} />}>
          {ctaLabel}
        </Button>
      </Container>
    </section>
  );
}
