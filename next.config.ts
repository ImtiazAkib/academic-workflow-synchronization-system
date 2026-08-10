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
};

const withNextIntl = createNextIntlPlugin({
  requestConfig: './l10n/request.config.ts',
  experimental: {
    // types the message keys, so `l10n('TYPO')` is a compile error
    createMessagesDeclaration: ['./l10n/en-US.json'],
  },
});

export default withNextIntl(nextConfig);
