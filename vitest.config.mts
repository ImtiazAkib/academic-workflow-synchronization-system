import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // The app's `@/*` alias, so tests import exactly as the source does.
  resolve: {
    alias: [{ find: /^@\/(.*)$/, replacement: `${rootDir}/$1` }],
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    /*
      `env/server.ts` validates the environment the moment any module under test imports it,
      so the two required variables are given dummy values here. Nothing in these unit tests
      reaches a database or signs a real session — the auth-secret is only used to prove the
      token round-trip and the schema rejection in `session.test.ts`.
    */
    env: {
      MONGODB_URI: 'mongodb://127.0.0.1:27017/test',
      AUTH_SECRET: 'unit-test-secret-at-least-32-characters-long',
    },
  },
});
