import type { Metadata, Viewport } from 'next';

import { Anek_Bangla, Inter, Noto_Sans_Bengali, Poppins } from 'next/font/google';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { APP_DATA, APP_THEMES, getMessageLocale, I18N, SEO, THEME_COOKIE_NAME } from '@/constants';
import { env } from '@/env/server';
import { routing } from '@/l10n/routing';
import { AppLocale } from '@/types';

import { buildLocaleUrl, cn } from '@/lib/utils';

import { SkipToContent, ThemeProvider } from '@/components/shared';

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
 * Enumerate the known locales for the `[locale]` segment.
 *
 * These no longer prerender: the layout reads the theme cookie, which opts the tree into
 * per-request rendering. The list still bounds `[locale]` to real locales so an unknown
 * one is a 404 rather than a render attempt.
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

  /*
    Checked here as well as in the layout, because metadata is built first. A browser
    asking for `/favicon.ico` matches this dynamic segment with `locale` set to
    "favicon.ico", and without this guard that string reaches `getTranslations()` and
    then `Intl`, which complains about an invalid locale identifier before the layout
    below ever gets to reject it.
  */
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

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

/*
  Browser-chrome color, matched to the app background in each scheme (R1). Replaces a
  hardcoded indigo (#4f46e5) that belonged to neither the old nor the new palette; these are
  the sRGB of `--background` light/dark, so the mobile address bar meets the page seamlessly.
*/
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfcfe' },
    { media: '(prefers-color-scheme: dark)', color: '#090d15' },
  ],
};

/*
  The root layout carries the document and the locale, nothing else. Page chrome belongs to
  the route groups — `(marketing)` has the site header and footer, `(dashboard)` has the
  sidebar, `(auth)` has neither — because a dashboard nested inside the marketing header
  would inherit navigation it has no use for.
*/
export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const l10n = await getTranslations();

  /*
    The theme is decided here, on the server, from a cookie the client keeps current —
    which is why there is no theme `<script>` anywhere. A script that set the class before
    paint had to live in this layout, and this layout re-renders on the client every time
    the language changes; React 19.2 then errored on the reconciled `<script>`, on every
    switch. Reading a cookie instead means `<html>` arrives already carrying `.dark`, with
    nothing for React to reconcile. The cost is that this layout now reads a cookie, so the
    pages under it render per-request rather than statically.

    Only an explicit `dark` renders dark; an absent cookie (a first visit, or the `system`
    choice before its resolved value has been written) renders light, and the provider
    corrects it on mount — one flash on a first visit for a system-dark visitor, never
    again.
  */
  const isDark = (await cookies()).get(THEME_COOKIE_NAME)?.value === APP_THEMES.DARK;

  return (
    /*
      The font variables sit on <html>, not <body>. `--font-body` is declared on <html>
      too, and a custom property is resolved against the element that declares it — so if
      the faces were declared one level down on <body>, the per-language swap in globals.css
      would resolve to nothing.

      `suppressHydrationWarning` because the provider may correct the theme on mount (the
      `system` case above), and a corrected class on <html> is a difference React would
      otherwise report.
    */
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={cn(inter.variable, poppins.variable, notoSansBengali.variable, anekBangla.variable, isDark && 'dark')}
      style={{ colorScheme: isDark ? 'dark' : 'light' }}>
      <body className="font-sans antialiased">
        {/* First in the tab order, before every provider, so it is reachable on the first press of Tab. */}
        <SkipToContent label={l10n('SKIP_TO_CONTENT')} />

        {/*
          `NuqsAdapter` teaches nuqs how this app routes. It wraps the whole tree rather than
          the one screen that uses it, because the hooks read from context and a later screen
          adding a URL filter should not have to remember this.
        */}
        <ThemeProvider>
          <NextIntlClientProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
