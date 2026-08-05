import type { Metadata, Viewport } from 'next';

import { Anek_Bangla, Inter, Noto_Sans_Bengali, Poppins } from 'next/font/google';
import { notFound } from 'next/navigation';

import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { APP_DATA } from '@/constants';
import { routing } from '@/l10n/routing';

import { SiteFooter, SiteHeader } from '@/components/layout';

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

  return {
    title: l10n('APP_METADATA_TITLE'),
    description: l10n('APP_METADATA_DESCRIPTION'),
    openGraph: {
      type: 'website',
      siteName: APP_DATA.SHORT_NAME,
      title: l10n('APP_METADATA_TITLE'),
      description: l10n('APP_METADATA_DESCRIPTION'),
    },
    twitter: {
      card: 'summary_large_image',
      title: l10n('APP_METADATA_TITLE'),
      description: l10n('APP_METADATA_DESCRIPTION'),
    },
    robots: {
      index: true,
      follow: true,
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

  return (
    /*
      The font variables sit on <html>, not <body>. `--font-body` is declared on <html>
      too, and a custom property is resolved against the element that declares it — so
      if the faces were declared one level down on <body>, the per-language swap in
      globals.css would resolve to nothing.
    */
    <html lang={locale} className={`${inter.variable} ${poppins.variable} ${notoSansBengali.variable} ${anekBangla.variable}`}>
      <body className="font-sans antialiased">
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
