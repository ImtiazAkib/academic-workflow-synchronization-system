import { getTranslations } from 'next-intl/server';

import { buildJsonLdGraph, getMessageLocale } from '@/constants';
import { env } from '@/env/server';
import { AppLocale } from '@/types';

import { SiteFooter, SiteHeader } from '@/components/layout';
import { JsonLd } from '@/components/shared';

type MarketingLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/*
  The public face of the site: header, footer and the structured data that describes
  it. None of that belongs on a signed-in dashboard, which is why this is a route
  group rather than part of the root layout.
*/
export default async function MarketingLayout({ children, params }: MarketingLayoutProps) {
  const { locale } = await params;

  const l10n = await getTranslations();

  const jsonLd = buildJsonLdGraph({
    baseUrl: env.APP_BASE_URL,
    description: l10n('APP_METADATA_DESCRIPTION'),
    language: getMessageLocale(locale as AppLocale),
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <JsonLd data={jsonLd} />

      <SiteHeader />

      <main className="flex-1">{children}</main>

      <SiteFooter />
    </div>
  );
}
