import { getTranslations } from 'next-intl/server';

import { APP_DATA, ROUTES, SECTION_IDS } from '@/constants';
import { Link } from '@/l10n/navigation';

import { AppLogo, Container, LanguageSelector } from '@/components/shared';
import { Button } from '@/components/ui';

const NAV_LINK_CLASS = 'text-muted-foreground hover:text-foreground text-sm font-medium transition-colors';

export async function SiteHeader() {
  const l10n = await getTranslations();

  return (
    <header className="bg-background/80 border-border sticky top-0 z-50 border-b backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href={ROUTES.HOME.HREF} className="flex items-center gap-2.5">
          <AppLogo className="size-8" />
          <span className="font-heading text-regular-bold tracking-tight">{APP_DATA.SHORT_NAME}</span>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-6 md:flex">
            <a href={`#${SECTION_IDS.ROLES}`} className={NAV_LINK_CLASS}>
              {l10n('NAV_ROLES')}
            </a>

            <a href={`#${SECTION_IDS.FEATURES}`} className={NAV_LINK_CLASS}>
              {l10n('NAV_FEATURES')}
            </a>

            <a href={`#${SECTION_IDS.STACK}`} className={NAV_LINK_CLASS}>
              {l10n('NAV_STACK')}
            </a>

            <a href={`#${SECTION_IDS.ROADMAP}`} className={NAV_LINK_CLASS}>
              {l10n('NAV_ROADMAP')}
            </a>
          </nav>

          <LanguageSelector label={l10n('LANGUAGE_SELECTOR_LABEL')} />

          <Button variant="appOutline" size="sm" nativeButton={false} render={<Link href={ROUTES.SIGN_IN.HREF} />}>
            {l10n('NAV_SIGN_IN')}
          </Button>
        </div>
      </Container>
    </header>
  );
}
