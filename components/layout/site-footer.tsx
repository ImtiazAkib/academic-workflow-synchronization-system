import { getTranslations } from 'next-intl/server';

import { APP_DATA } from '@/constants';

import { AppLogo, Container } from '@/components/shared';

// cspell:ignore Imtiaz Akib

export async function SiteFooter() {
  const l10n = await getTranslations();

  // Passed as a string on purpose: an ICU `{year, number}` would be grouped as 2,026.
  const year = String(new Date().getFullYear());

  return (
    <footer className="border-border border-t">
      <Container className="flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <AppLogo label={l10n('APP_LOGO_ALT')} className="size-12" />

          <div className="flex flex-col">
            <span className="font-heading text-regular-bold tracking-tight">{APP_DATA.SHORT_NAME}</span>
            <span className="text-muted-foreground text-sm">{APP_DATA.TAGLINE}</span>
          </div>
        </div>

        <p className="text-muted-foreground text-sm">
          {l10n('FOOTER_COPYRIGHT', { year })} {'\u2022'} Made by{' '}
          <a
            href="https://github.com/ImtiazAkib"
            target="_blank"
            rel="noreferrer"
            className="text-foreground hover:text-primary font-semibold transition-colors">
            Imtiaz Akib
          </a>
        </p>
      </Container>
    </footer>
  );
}
