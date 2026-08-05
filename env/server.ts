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

    /*
      Indexing switch. Defaults to off so a staging deploy cannot be indexed by
      forgetting a variable — production has to turn it on deliberately.
    */
    ROBOTS_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform(value => value === 'true'),

    /*
      Required from step 4 onward. The database name is NOT read from this string —
      `lib/mongodb.ts` passes it explicitly, so an Atlas URI copied without its path
      segment cannot silently write to a database called `test`.
    */
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

    // Authentication — becomes required in step 5
    AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters').optional(),
  },
  experimental__runtimeEnv: process.env,
});
