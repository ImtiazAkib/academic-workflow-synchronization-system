import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/*
  Server-side environment. Imported at the top of `next.config.ts`, so an invalid or
  missing variable fails the build instead of surfacing as a runtime error on some
  request nobody made yet.

  `MONGODB_URI` and `AUTH_SECRET` are optional for now: nothing reads the database
  until the data model lands, and nothing signs a session until authentication does.
  Each becomes required in the step that starts using it.
*/
export const env = createEnv({
  server: {
    // Logging
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    // App
    APP_BASE_URL: z.url().default('http://localhost:3000'),

    // Database — becomes required in step 3
    MONGODB_URI: z.string().min(1).optional(),

    // Authentication — becomes required in step 4
    AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters').optional(),
  },
  experimental__runtimeEnv: process.env,
});
