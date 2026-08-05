import { APP_DATA } from '@/constants';

import { AppLogo, Container } from '@/components/shared';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border border-t">
      <Container className="flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <AppLogo className="size-9" />

          <div className="flex flex-col">
            <span className="font-heading text-regular-bold tracking-tight">{APP_DATA.SHORT_NAME}</span>
            <span className="text-muted-foreground text-sm">{APP_DATA.NAME}</span>
          </div>
        </div>

        <p className="text-muted-foreground text-sm">© {year} — departmental project, built with Next.js and MongoDB.</p>
      </Container>
    </footer>
  );
}
