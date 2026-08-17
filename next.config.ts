import type { NextConfig } from 'next';

import createNextIntlPlugin from 'next-intl/plugin';

import '@/env/client';
import '@/env/server';

const production = process.env.NODE_ENV === 'production';

/*
  `output: 'standalone'` exists for the PM2 deployment, which runs
  `.next/standalone/server.js`. Vercel traces and packages the output itself, and there
  the standalone copy step dies on a missing `.next/next-server.js.nft.json`. The option
  buys nothing on Vercel, so it is left off when VERCEL is set — which Vercel does on
  every build.
*/
const selfHosted = !process.env.VERCEL;

/*
  `sharp` is a native module: its `.node` binaries cannot be bundled, so it has to be
  required at runtime from `node_modules` on both targets. The storage layer re-encodes
  every uploaded image through it.
*/
const packagesForProduction = ['pino', 'sharp'];
const packagesForDevelopment = ['pino', 'pino-pretty', 'sharp'];

const consoleForProduction = {
  exclude: ['error', 'warn'],
};
const consoleForDevelopment = false;

const nextConfig: NextConfig = {
  // build optimizations
  output: selfHosted ? 'standalone' : undefined,
  poweredByHeader: false,
  reactStrictMode: true,

  // type safety
  typedRoutes: true,

  // the pino transport worker breaks when bundled
  serverExternalPackages: production ? packagesForProduction : packagesForDevelopment,

  // compiler optimizations
  compiler: {
    removeConsole: production ? consoleForProduction : consoleForDevelopment,
  },

  images: {
    deviceSizes: [640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [25, 50, 75, 100],
  },

  /*
    Security headers on every page response. `/api` is excluded on purpose: the
    file-serving routes there set their own stricter `Content-Security-Policy: sandbox` plus
    `nosniff` and a download disposition, which must stay authoritative — and a JSON or file
    response is not a clickjacking target the way a page is.

    The CSP carries only the directives that do not need a per-request nonce. Next injects
    inline hydration scripts, so a restrictive `script-src` would break the app unless a
    nonce were plumbed through the middleware — a larger change left for a follow-up. What
    is here still shuts the clickjacking door (`frame-ancestors`) and the base-tag, plugin
    and off-site-form vectors, and the standalone headers cover framing, MIME sniffing,
    referrer leakage and feature access.
  */
  async headers() {
    const securityHeaders = [
      {
        key: 'Content-Security-Policy',
        value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'",
      },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ];

    if (production) {
      /*
        HTTPS-only, and only in production: a browser ignores HSTS sent over plain http
        anyway, and pinning a dev origin served over https to HTTPS would be a foot-gun.
      */
      securityHeaders.push({ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' });
    }

    return [{ source: '/((?!api/).*)', headers: securityHeaders }];
  },
};

const withNextIntl = createNextIntlPlugin({
  requestConfig: './l10n/request.config.ts',
  experimental: {
    // types the message keys, so `l10n('TYPO')` is a compile error
    createMessagesDeclaration: ['./l10n/en-US.json'],
  },
});

export default withNextIntl(nextConfig);
