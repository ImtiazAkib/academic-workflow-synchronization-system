import { AppLocale } from '@/types';

// Imported from the module rather than the `@/constants` barrel to keep this helper
// free of the barrel's React dependencies — it is used from metadata routes.
import { DEFAULT_APP_LOCALE } from '@/constants/i18n.const';

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
