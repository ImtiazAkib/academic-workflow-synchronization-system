import { hasLocale } from 'next-intl';
import { getRequestConfig, RequestConfig } from 'next-intl/server';

import { DEFAULT_TIMEZONE, getMessageLocale } from '@/constants';

import { i18nFormats } from './format.config';
import { routing } from './routing';

/**
 * Resolves the locale for the current request from the URL segment and loads the
 * dictionary that backs it. The URL is the authority — the cookie only influences
 * which URL the visitor is sent to, in `proxy.ts`.
 */
const appI18nRequest = async ({ requestLocale }: { requestLocale: Promise<string | undefined> }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const messageLocale = getMessageLocale(locale);
  const localization = await import(`./${messageLocale}.json`);

  const config: RequestConfig = {
    locale,
    timeZone: DEFAULT_TIMEZONE,
    messages: localization.default,
    formats: i18nFormats,
  };

  return config;
};

export default getRequestConfig(appI18nRequest);
