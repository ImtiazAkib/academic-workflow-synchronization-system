import type { NextConfig } from 'next';

import '@/env/client';
import '@/env/server';

const production = process.env.NODE_ENV === 'production';

const packagesForProduction = ['pino'];
const packagesForDevelopment = ['pino', 'pino-pretty'];

const consoleForProduction = {
  exclude: ['error', 'warn'],
};
const consoleForDevelopment = false;

const nextConfig: NextConfig = {
  // build optimizations
  output: 'standalone',
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

export default nextConfig;
