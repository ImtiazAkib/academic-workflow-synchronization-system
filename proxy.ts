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
import { isSameOriginRequest } from '@/lib/api/same-origin.guard';
import { verifySessionToken } from '@/lib/auth/session';
// Also module-direct rather than `@/lib/utils`, so the edge bundle carries only the
// path helper instead of every util the barrel re-exports.
import { splitLocaleFromPathname } from '@/lib/utils/url.utils';

/*
  Next.js 16 calls this file `proxy.ts` (it was `middleware.ts` before). Only one is
  allowed, so locale negotiation and the route guard share it.
*/
const handleI18nRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  /*
    API routes are answered before locale negotiation ever runs — an `/api` path must
    never be rewritten to `/bn/api`. They exist only for this app's own screens, so a
    request that did not come from a page of ours is refused here, before the handler
    reads a body or touches the database.

    This is a perimeter, not the control: every handler still checks the session and the
    caller's role. A same-origin check keeps other sites and stray scripts out; it does
    not decide who may see what.
  */
  if (request.nextUrl.pathname.startsWith('/api')) {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Forbidden action.' }, { status: 403 });
    }

    return NextResponse.next();
  }

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
    `api` is deliberately no longer excluded — the guard above cannot run on a path the
    matcher never hands over. The proxy returns early for those, so they are still never
    rewritten to a locale-prefixed path.

    Next internals and anything with a file extension stay out.
  */
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
