import { getTranslations } from 'next-intl/server';

import { DEFAULT_APP_LOCALE } from '@/constants';
import { env } from '@/env/server';

import { buildLlmsFullTxt } from '@/lib/llms.utils';
import { buildLocaleUrl } from '@/lib/url.utils';

export async function GET() {
  const l10n = await getTranslations({ locale: DEFAULT_APP_LOCALE });
  const baseUrl = env.APP_BASE_URL;

  const body = buildLlmsFullTxt({
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
