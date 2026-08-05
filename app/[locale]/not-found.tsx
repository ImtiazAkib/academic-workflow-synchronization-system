import { getTranslations } from 'next-intl/server';

import { AppLogo, Container, NotFoundContent } from '@/components/shared';

/*
  The boundary for `notFound()` thrown by the locale layout itself — an unknown locale
  segment, before any route group has run. It carries its own masthead because no
  group layout is in scope to provide one.

  Routes inside `(marketing)` use that group's not-found instead, which keeps the site
  header and footer.
*/
export default async function NotFound() {
  const l10n = await getTranslations();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-border border-b">
        <Container className="flex h-16 items-center">
          <AppLogo className="size-8" />
        </Container>
      </header>

      <main className="flex flex-1 items-center">
        <NotFoundContent title={l10n('NOT_FOUND_TITLE')} description={l10n('NOT_FOUND_DESCRIPTION')} ctaLabel={l10n('NOT_FOUND_CTA')} />
      </main>
    </div>
  );
}
