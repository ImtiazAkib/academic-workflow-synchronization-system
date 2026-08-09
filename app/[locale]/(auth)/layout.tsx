import { getTranslations } from 'next-intl/server';

import { APP_DATA, ROUTES } from '@/constants';
import { Link } from '@/l10n/navigation';

import { MAIN_CONTENT_ID } from '@/constants/a11y.const';

import { AppLogo, Container, LanguageSelector, ThemeSelector } from '@/components/shared';

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

          <ThemeSelector
            labels={{
              group: l10n('THEME_SELECTOR_LABEL'),
              light: l10n('THEME_LIGHT'),
              dark: l10n('THEME_DARK'),
              system: l10n('THEME_SYSTEM'),
            }}
          />

          <LanguageSelector label={l10n('LANGUAGE_SELECTOR_LABEL')} />
        </Container>
      </header>

      {/*
        `flex-col` matters: as a row, the section inside is a flex item that shrinks to
        its content and settles against the left edge. Stacking makes it fill the width,
        so the card its own `justify-center` centres actually has a full row to centre in.
      */}
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex flex-1 flex-col justify-center">
        {children}
      </main>
    </div>
  );
}
