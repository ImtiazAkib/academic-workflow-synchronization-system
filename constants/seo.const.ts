import { APP_LOCALES, DEFAULT_APP_LOCALE } from './i18n.const';

/*
  Route segments that must never be indexed. The `Disallow` lines built from these are
  only a request to well-behaved crawlers — the enforcing half is the `noindex`
  metadata on the dashboard layout, which lands with that layout in step 6.
*/
const PRIVATE_SEGMENTS = ['/sign-in', '/admin', '/teacher', '/student'];

export const SEO = {
  KEYWORDS: [
    'academic workflow',
    'class scheduling system',
    'course materials',
    'department management',
    'role-based access control',
    'university dashboard',
    'Next.js MongoDB',
  ],

  /**
   * Every private segment, once per locale prefix.
   */
  DISALLOWED_PATHS: APP_LOCALES.flatMap(locale =>
    PRIVATE_SEGMENTS.map(segment => (locale === DEFAULT_APP_LOCALE ? segment : `/${locale}${segment}`))
  ),

  SITEMAP: {
    HOME_PRIORITY: 1,
    CHANGE_FREQUENCY: 'monthly',
  },
} as const;
