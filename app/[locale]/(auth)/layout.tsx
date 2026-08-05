import { getTranslations } from 'next-intl/server';

import { APP_DATA, ROUTES } from '@/constants';
import { Link } from '@/l10n/navigation';

import { AppLogo, Container, LanguageSelector } from '@/components/shared';

type AuthLayoutProps = {
  children: React.ReactNode;
};

/*
  Deliberately quiet: no site navigation to wander off into while signing in. The
  language selector stays, because someone who cannot read the form needs it most.
*/
export default async function AuthLayout({ children }: AuthLayoutProps) {
  const l10n = await getTranslations();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-border border-b">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link href={ROUTES.HOME.HREF} className="flex items-center gap-2.5">
            <AppLogo className="size-8" />
            <span className="font-heading text-regular-bold tracking-tight">{APP_DATA.SHORT_NAME}</span>
          </Link>

          <LanguageSelector label={l10n('LANGUAGE_SELECTOR_LABEL')} />
        </Container>
      </header>

      <main className="flex flex-1 items-center">{children}</main>
    </div>
  );
}
