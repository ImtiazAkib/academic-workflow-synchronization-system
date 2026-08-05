import pino from 'pino';

import { env } from '@/env/server';

const production = process.env.NODE_ENV === 'production';

/*
  Structured JSON in production so the output is machine-readable; pretty-printed and
  colorized in development so it is human-readable. `pino` and `pino-pretty` are listed
  in `serverExternalPackages` — bundling them breaks the transport worker.
*/
export const logger = pino({
  level: env.LOG_LEVEL,
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  ...(!production && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
        levelFirst: true,
      },
    },
  }),
});

/**
 * Create a child logger that tags every line with where it came from.
 *
 * @param context - Context name, usually the service or route.
 *
 * @returns A logger with the context bound to it.
 *
 * @example
 * ```ts
 * const log = createLoggerWithContext('user.service');
 * log.info({ userId }, 'Approved account');
 * ```
 */
export function createLoggerWithContext(context: string) {
  return logger.child({ context });
}
