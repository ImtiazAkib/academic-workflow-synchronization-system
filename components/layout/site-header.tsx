import { getTranslations } from 'next-intl/server';

import { APP_DATA, ROUTES, SECTION_IDS } from '@/constants';
import { Link } from '@/l10n/navigation';

import { AppLogo, Container, LanguageSelector, ThemeSelector } from '@/components/shared';
import { Button } from '@/components/ui';

export async function SiteHeader() {
  const l10n = await getTranslations();

  return (
    <header className="bg-background/80 border-border sticky top-0 z-50 border-b backdrop-blur-md">
      {/*
        Tightened gaps below `sm`, and the brand is allowed to shrink: at 375px the
        language selector and sign-in button together are wider than what is left after
        a non-shrinking brand, which pushed the row 11px past the viewport.
      */}
      <Container className="flex h-16 items-center justify-between gap-2 sm:gap-4">
        <Link href={ROUTES.HOME.HREF} className="flex min-w-0 items-center gap-2.5">
          <AppLogo label={l10n('APP_LOGO_ALT')} className="size-8 shrink-0" />
          <span className="font-heading text-regular-bold truncate tracking-tight">{APP_DATA.SHORT_NAME}</span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <nav className="hidden items-center gap-6 md:flex">
            <a href={`#${SECTION_IDS.ROLES}`} className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
              {l10n('NAV_ROLES')}
            </a>

            <a href={`#${SECTION_IDS.FEATURES}`} className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
              {l10n('NAV_FEATURES')}
            </a>

            <a href={`#${SECTION_IDS.STACK}`} className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
              {l10n('NAV_STACK')}
            </a>

            <a href={`#${SECTION_IDS.ROADMAP}`} className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
              {l10n('NAV_ROADMAP')}
            </a>
          </nav>

          <ThemeSelector
            labels={{
              group: l10n('THEME_SELECTOR_LABEL'),
              light: l10n('THEME_LIGHT'),
              dark: l10n('THEME_DARK'),
              system: l10n('THEME_SYSTEM'),
            }}
          />

          <LanguageSelector label={l10n('LANGUAGE_SELECTOR_LABEL')} />

          <Button variant="appOutline" size="sm" nativeButton={false} render={<Link href={ROUTES.SIGN_IN.HREF} />}>
            {l10n('NAV_SIGN_IN')}
          </Button>
        </div>
      </Container>
    </header>
  );
}
