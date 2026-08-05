import { getTranslations } from 'next-intl/server';

import { DEFAULT_APP_LOCALE } from '@/constants';
import { env } from '@/env/server';

import { buildLlmsTxt } from '@/lib/llms.utils';
import { buildLocaleUrl } from '@/lib/url.utils';

/*
  Served in English only, with a link to the Bangla site in the header. The convention
  is English-centric, and a per-locale copy is one more thing to drift.

  The proxy matcher skips anything containing a dot, so this path is never rewritten
  to a locale-prefixed one.
*/
export async function GET() {
  const l10n = await getTranslations({ locale: DEFAULT_APP_LOCALE });
  const baseUrl = env.APP_BASE_URL;

  const body = buildLlmsTxt({
    l10n,
    homeUrl: buildLocaleUrl(baseUrl, DEFAULT_APP_LOCALE),
    banglaUrl: buildLocaleUrl(baseUrl, 'bn'),
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
