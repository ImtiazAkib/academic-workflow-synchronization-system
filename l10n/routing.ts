import { defineRouting } from 'next-intl/routing';

// Imported from the module rather than the `@/constants` barrel on purpose: this file
// is pulled into the middleware bundle by `proxy.ts`, and the barrel drags in
// `lucide-react` with it, which the middleware runtime cannot resolve.
import { APP_LOCALES, DEFAULT_APP_LOCALE, I18N } from '@/constants/i18n.const';

/*
  `as-needed` keeps the default locale unprefixed: English at `/`, Bangla at `/bn`.
  Two URLs means both languages can be indexed — the cookie only remembers a
  returning visitor's choice, it never decides what renders.
*/
export const routing = defineRouting({
  locales: APP_LOCALES,
  defaultLocale: DEFAULT_APP_LOCALE,
  localePrefix: 'as-needed',
  localeCookie: {
    name: I18N.COOKIE.NAME,
    maxAge: I18N.COOKIE.MAX_AGE,
  },
});
