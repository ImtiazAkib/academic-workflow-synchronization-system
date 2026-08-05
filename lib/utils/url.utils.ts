import { AppLocale } from '@/types';

// Imported from the module rather than the `@/constants` barrel to keep this helper
// free of the barrel's React dependencies — it is used from metadata routes and from
// the middleware.
import { APP_LOCALES, DEFAULT_APP_LOCALE } from '@/constants/i18n.const';

/**
 * Build an absolute URL for a locale.
 * The default locale carries no prefix, matching `localePrefix: 'as-needed'`.
 *
 * @param baseUrl - Absolute origin, without a trailing slash.
 * @param locale - URL locale.
 * @param path - Path within the locale, defaults to the home page.
 *
 * @returns Absolute URL.
 */
export function buildLocaleUrl(baseUrl: string, locale: AppLocale, path = '/'): string {
  const prefix = locale === DEFAULT_APP_LOCALE ? '' : `/${locale}`;
  const suffix = path === '/' ? (prefix ? '' : '/') : path;

  return `${baseUrl}${prefix}${suffix}`;
}

/**
 * Split a request path into its locale and the route underneath it.
 *
 * `/bn/admin` is the same route as `/admin` as far as the guard is concerned, so the
 * prefix has to come off before any segment comparison. An unprefixed path is the
 * default locale by definition of `localePrefix: 'as-needed'`.
 *
 * @param pathname - Path from the request URL.
 *
 * @returns The locale it names, and the path with the prefix removed.
 */
export function splitLocaleFromPathname(pathname: string): { locale: AppLocale; routePath: string } {
  const [, firstSegment = '', ...rest] = pathname.split('/');
  const matched = APP_LOCALES.find(locale => locale === firstSegment);

  if (!matched) {
    return { locale: DEFAULT_APP_LOCALE, routePath: pathname };
  }

  return { locale: matched, routePath: `/${rest.join('/')}` };
}
