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
/*
  An unset variable and one that is present but empty mean the same thing.

  This is not a nicety. `.env.example` ships the optional keys blank, so copying it — the
  documented first step — hands every one of them an empty string. Without this, `min(1)`
  refuses all of them, and because `proxy.ts` imports this module the failure lands in the
  middleware: every route in the application returns a 500, on a clean clone, before
  anybody has typed anything wrong.

  @param schema - The schema to apply once a real value is present.

  @returns The same schema, with an empty string read as absence.
*/
function blankAsAbsent<T extends z.ZodType>(schema: T) {
  return z.preprocess(value => (value === '' ? undefined : value), schema);
}

/** An optional string that tolerates the blank line `.env.example` ships. */
const optionalText = blankAsAbsent(z.string().min(1).optional());

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

    /*
      Signs the session token. Required — a missing or short secret means a session
      can be forged, so it fails the build rather than degrading quietly.
    */
    AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),

    /*
      Mail, from step 12. Deliberately optional, and the only place in this file where
      that is a feature rather than a leftover: with `SMTP_HOST` unset the mail layer
      falls back to a driver that writes every message to the log, so a clean clone can
      register an account, follow the verification link and receive an identifier without
      any credentials at all.

      A production deploy that forgets these does not fail the build — it logs a warning
      per unsent message carrying a link nobody received. That is a visible failure, which
      is the point; making it fatal would mean no local development without a mail server.
    */
    SMTP_HOST: optionalText,
    SMTP_PORT: blankAsAbsent(z.coerce.number().int().min(1).max(65535).default(587)),
    SMTP_USER: optionalText,
    SMTP_PASSWORD: optionalText,
    /** The `From` address. Many relays reject a message whose sender they do not own. */
    SMTP_FROM: blankAsAbsent(z.string().min(1).default('Academic Workflow <no-reply@localhost>')),
  },
  experimental__runtimeEnv: process.env,
});
