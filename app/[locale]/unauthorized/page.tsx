import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { ROLE_HOME } from '@/constants';
import { Link } from '@/l10n/navigation';

import { requireSession } from '@/lib/auth';

import { AppLogo, Container } from '@/components/shared';
import { Button } from '@/components/ui';

type UnauthorizedPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: UnauthorizedPageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('UNAUTHORIZED_TITLE'),
    robots: { index: false, follow: false },
  };
}

/*
  Reached by someone who *is* signed in and asked for an area belonging to another
  role. Distinct from the sign-in page on purpose: telling an authenticated teacher to
  sign in reads as a bug, not a refusal.
*/
export default async function UnauthorizedPage() {
  // Signed out, this is a sign-in problem rather than a permission one.
  const sessionUser = await requireSession();

  const l10n = await getTranslations();

  return (
    <section className="flex min-h-dvh items-center">
      <Container className="flex flex-col items-center gap-6 text-center">
        <AppLogo className="size-11" />

        <span className="text-gradient-brand font-heading text-6xl font-bold">403</span>

        <h1 className="text-2xl sm:text-3xl">{l10n('UNAUTHORIZED_TITLE')}</h1>

        <p className="text-medium-normal text-muted-foreground max-w-xl">{l10n('UNAUTHORIZED_DESCRIPTION')}</p>

        <Button variant="appPrimary" size="lg" nativeButton={false} render={<Link href={ROLE_HOME[sessionUser.role]} />}>
          {l10n('UNAUTHORIZED_CTA')}
        </Button>
      </Container>
    </section>
  );
}
