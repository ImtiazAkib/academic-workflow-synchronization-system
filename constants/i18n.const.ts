import { AppLocale, LocaleModel, MessageLocale } from '@/types';

/**
 * URL locales, in the order they appear in the language selector.
 * Declared as a tuple so next-intl can infer literal types for typed navigation.
 */
export const APP_LOCALES = ['en', 'bn'] as const satisfies readonly AppLocale[];

export const DEFAULT_APP_LOCALE: AppLocale = 'en';

export const I18N = {
  COOKIE: {
    NAME: 'academic.locale',
    MAX_AGE: 60 * 60 * 24 * 365,
  },
  LOCALES: [
    {
      name: 'English',
      nativeName: 'English',
      locale: 'en',
      code: 'en-US',
      default: true,
    },
    {
      name: 'Bangla',
      nativeName: 'বাংলা',
      locale: 'bn',
      code: 'bn-BD',
    },
  ] as LocaleModel[],
} as const;

/**
 * Map a URL locale to the dictionary that backs it.
 * The only place the two-tier locale model is resolved — nothing else should
 * reference `en-US` or `bn-BD` directly.
 *
 * @param locale - URL locale.
 *
 * @returns The message dictionary locale.
 */
export function getMessageLocale(locale: AppLocale): MessageLocale {
  const match = I18N.LOCALES.find(x => x.locale === locale);
  return match ? match.code : 'en-US';
}
