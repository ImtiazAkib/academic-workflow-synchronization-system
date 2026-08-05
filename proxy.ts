import { NextResponse, type NextRequest } from 'next/server';

import createMiddleware from 'next-intl/middleware';

import { routing } from '@/l10n/routing';

import { SESSION } from '@/constants/auth.const';
import { DEFAULT_APP_LOCALE } from '@/constants/i18n.const';
import { PROTECTED_SEGMENTS, ROUTES } from '@/constants/routes.const';

/*
  Imported from `session.ts`, not the `@/lib/auth` barrel: the barrel also exports the
  cookie helpers, which use `next/headers` — unavailable in the middleware runtime.
  Verifying a token needs only `jose`, which runs there happily.
*/
import { verifySessionToken } from '@/lib/auth/session';
import { splitLocaleFromPathname } from '@/lib/url.utils';

/*
  Next.js 16 calls this file `proxy.ts` (it was `middleware.ts` before). Only one is
  allowed, so locale negotiation and the route guard share it.
*/
const handleI18nRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { locale, routePath } = splitLocaleFromPathname(request.nextUrl.pathname);

  const isProtected = PROTECTED_SEGMENTS.some(segment => routePath === segment || routePath.startsWith(`${segment}/`));

  if (isProtected) {
    // Only verify where it matters — a public page should not pay for the check.
    const token = request.cookies.get(SESSION.COOKIE.NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;

    if (!session) {
      /*
        Redirect to sign-in in the language the visitor was already reading, and
        remember where they were headed so they land there afterwards.
      */
      const prefix = locale === DEFAULT_APP_LOCALE ? '' : `/${locale}`;
      const signInUrl = new URL(`${prefix}${ROUTES.SIGN_IN.HREF}`, request.nextUrl.origin);
      signInUrl.searchParams.set('next', request.nextUrl.pathname);

      return NextResponse.redirect(signInUrl);
    }
  }

  // Locale negotiation still has to run for every request that is allowed through.
  return handleI18nRouting(request);
}

export const config = {
  /*
    Match everything except API routes, Next internals and anything with a file
    extension. Those must never be rewritten to a locale-prefixed path.
  */
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
