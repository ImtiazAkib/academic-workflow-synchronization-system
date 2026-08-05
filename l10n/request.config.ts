import { notFound } from 'next/navigation';
import * as rootParams from 'next/root-params';

import { hasLocale } from 'next-intl';
import { getRequestConfig, RequestConfig } from 'next-intl/server';

import { DEFAULT_TIMEZONE, getMessageLocale } from '@/constants';
import { AppLocale } from '@/types';

import { i18nFormats } from './format.config';
import { routing } from './routing';

/**
 * Resolves the locale for the current request and loads the dictionary behind it.
 *
 * The locale comes from the `[locale]` root param — Next reads it natively as of
 * 16.3, which is what replaced next-intl's deprecated `setRequestLocale()` calls in
 * every layout and page.
 *
 * `next/root-params` is not available in Route Handlers or Server Actions, so callers
 * there pass a locale explicitly (`getTranslations({ locale })`) and it arrives here
 * as the `locale` argument — hence the branch rather than reading the param blindly.
 */
const appI18nRequest = async ({ locale }: { locale?: string }) => {
  let resolved = locale;

  if (!resolved) {
    const paramValue = await rootParams.locale();

    if (!hasLocale(routing.locales, paramValue)) {
      notFound();
    }

    resolved = paramValue;
  }

  const messageLocale = getMessageLocale(resolved as AppLocale);
  const localization = await import(`./${messageLocale}.json`);

  const config: RequestConfig = {
    locale: resolved,
    timeZone: DEFAULT_TIMEZONE,
    messages: localization.default,
    formats: i18nFormats,
  };

  return config;
};

export default getRequestConfig(appI18nRequest);
