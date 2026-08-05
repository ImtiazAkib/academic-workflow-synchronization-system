import Link from 'next/link';

import { ROUTES } from '@/constants';

import { Container } from '@/components/shared';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <section className="flex min-h-[60dvh] items-center">
      <Container className="flex flex-col items-center gap-6 text-center">
        <span className="text-gradient-brand font-heading text-7xl font-bold">404</span>

        <h2>Page not found</h2>

        <p className="text-medium-normal text-muted-foreground max-w-xl">
          The page you are looking for does not exist or has been moved. Let&apos;s get you back to the dashboard.
        </p>

        <Button variant="appPrimary" size="lg" nativeButton={false} render={<Link href={ROUTES.HOME.HREF} />}>
          {ROUTES.HOME.LABEL}
        </Button>
      </Container>
    </section>
  );
}
