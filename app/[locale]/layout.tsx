import type { Metadata, Viewport } from 'next';

import { Anek_Bangla, Inter, Noto_Sans_Bengali, Poppins } from 'next/font/google';
import { notFound } from 'next/navigation';

import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { APP_DATA, buildJsonLdGraph, getMessageLocale, I18N, SEO } from '@/constants';
import { env } from '@/env/server';
import { routing } from '@/l10n/routing';
import { AppLocale } from '@/types';

import { buildLocaleUrl } from '@/lib/url.utils';

import { SiteFooter, SiteHeader } from '@/components/layout';
import { JsonLd } from '@/components/shared';

import '../globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: '--font-noto-bengali',
  subsets: ['bengali'],
});

const anekBangla = Anek_Bangla({
  variable: '--font-anek-bangla',
  subsets: ['bengali'],
});

/**
 * Prerender both locales at build time instead of resolving them per request.
 */
export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Omit<LocaleLayoutProps, 'children'>): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  const baseUrl = env.APP_BASE_URL;
  const appLocale = locale as AppLocale;
  const title = l10n('APP_METADATA_TITLE');
  const description = l10n('APP_METADATA_DESCRIPTION');

  /*
    `languages` lists every locale plus `x-default`, which is what lets both languages
    be indexed separately instead of competing for the same URL. It is only possible
    because the locale is in the path.
  */
  const languages: Record<string, string> = Object.fromEntries(I18N.LOCALES.map(x => [x.code, buildLocaleUrl(baseUrl, x.locale)]));

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    keywords: [...SEO.KEYWORDS],
    alternates: {
      canonical: buildLocaleUrl(baseUrl, appLocale),
      languages: {
        ...languages,
        'x-default': buildLocaleUrl(baseUrl, routing.defaultLocale),
      },
    },
    openGraph: {
      type: 'website',
      siteName: APP_DATA.SHORT_NAME,
      url: buildLocaleUrl(baseUrl, appLocale),
      locale: getMessageLocale(appLocale).replace('-', '_'),
      alternateLocale: I18N.LOCALES.filter(x => x.locale !== appLocale).map(x => x.code.replace('-', '_')),
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    // Matches robots.txt: a deployment that has not opted into indexing says so twice.
    robots: {
      index: env.ROBOTS_ENABLED,
      follow: env.ROBOTS_ENABLED,
    },
    authors: [{ name: APP_DATA.NAME }],
  };
}

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  colorScheme: 'light',
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const l10n = await getTranslations({ locale });

  const jsonLd = buildJsonLdGraph({
    baseUrl: env.APP_BASE_URL,
    description: l10n('APP_METADATA_DESCRIPTION'),
    language: getMessageLocale(locale),
  });

  return (
    /*
      The font variables sit on <html>, not <body>. `--font-body` is declared on <html>
      too, and a custom property is resolved against the element that declares it — so
      if the faces were declared one level down on <body>, the per-language swap in
      globals.css would resolve to nothing.
    */
    <html lang={locale} className={`${inter.variable} ${poppins.variable} ${notoSansBengali.variable} ${anekBangla.variable}`}>
      <body className="font-sans antialiased">
        <JsonLd data={jsonLd} />

        <NextIntlClientProvider>
          <div className="flex min-h-dvh flex-col">
            <SiteHeader />

            <main className="flex-1">{children}</main>

            <SiteFooter />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
