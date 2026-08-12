import { APP_LOCALES, DEFAULT_APP_LOCALE } from './i18n.const';
import { PROTECTED_SEGMENTS, ROUTES } from './routes.const';

/*
  Route segments that must never be indexed: everything behind a session, plus the
  sign-in page itself. Derived from `PROTECTED_SEGMENTS` so the crawler rules and the
  route guard cannot drift apart.

  The `Disallow` lines are only a request to well-behaved crawlers - the enforcing
  half is the `noindex` metadata on the dashboard layout, which lands in step 6.
*/
const PRIVATE_SEGMENTS: readonly string[] = [ROUTES.SIGN_IN.HREF, ...PROTECTED_SEGMENTS];

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
