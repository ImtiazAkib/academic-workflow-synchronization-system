import Link from 'next/link';

import { APP_DATA, NAV_ITEMS, ROUTES } from '@/constants';

import { AppLogo, Container } from '@/components/shared';

export function SiteHeader() {
  return (
    <header className="bg-background/80 border-border sticky top-0 z-50 border-b backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href={ROUTES.HOME.HREF} className="flex items-center gap-2.5">
          <AppLogo className="size-8" />
          <span className="font-heading text-regular-bold tracking-tight">{APP_DATA.SHORT_NAME}</span>
        </Link>

        <nav aria-label="Sections" className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map(item => (
            <a key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
              {item.label}
            </a>
          ))}
        </nav>
      </Container>
    </header>
  );
}
