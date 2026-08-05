import createMiddleware from 'next-intl/middleware';

import { routing } from '@/l10n/routing';

/*
  Next.js 16 calls this file `proxy.ts` (it was `middleware.ts` before). Only one is
  allowed, so the authentication guard composes into this same function later rather
  than adding a second file — and it has to run after locale negotiation, so a
  redirect to sign-in lands on the right language.
*/
const handleI18nRouting = createMiddleware(routing);

export const proxy = handleI18nRouting;

export const config = {
  /*
    Match everything except API routes, Next internals and anything with a file
    extension. Those must never be rewritten to a locale-prefixed path.
  */
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
