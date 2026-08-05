import type { MetadataRoute } from 'next';

import { I18N, SEO } from '@/constants';
import { env } from '@/env/server';

import { buildLocaleUrl } from '@/lib/url.utils';

/*
  One entry per locale, each listing every language alternate plus `x-default`.
  Google reads the alternates from whichever entry it crawls first, so repeating the
  full set on both is the documented form rather than duplication.
*/
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.APP_BASE_URL;
  const lastModified = new Date();

  const languages: Record<string, string> = Object.fromEntries(I18N.LOCALES.map(x => [x.code, buildLocaleUrl(baseUrl, x.locale)]));

  const defaultLocale = I18N.LOCALES.find(x => x.default) ?? I18N.LOCALES[0];

  return I18N.LOCALES.map(x => ({
    url: buildLocaleUrl(baseUrl, x.locale),
    lastModified,
    changeFrequency: SEO.SITEMAP.CHANGE_FREQUENCY,
    priority: SEO.SITEMAP.HOME_PRIORITY,
    alternates: {
      languages: {
        ...languages,
        'x-default': buildLocaleUrl(baseUrl, defaultLocale.locale),
      },
    },
  }));
}
