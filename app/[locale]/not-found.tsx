import { getTranslations } from 'next-intl/server';

import { ROUTES } from '@/constants';
import { Link } from '@/l10n/navigation';

import { Container } from '@/components/shared';
import { Button } from '@/components/ui';

export default async function NotFound() {
  const l10n = await getTranslations();

  return (
    <section className="flex min-h-[60dvh] items-center">
      <Container className="flex flex-col items-center gap-6 text-center">
        <span className="text-gradient-brand font-heading text-7xl font-bold">404</span>

        <h2>{l10n('NOT_FOUND_TITLE')}</h2>

        <p className="text-medium-normal text-muted-foreground max-w-xl">{l10n('NOT_FOUND_DESCRIPTION')}</p>

        <Button variant="appPrimary" size="lg" nativeButton={false} render={<Link href={ROUTES.HOME.HREF} />}>
          {l10n('NOT_FOUND_CTA')}
        </Button>
      </Container>
    </section>
  );
}
