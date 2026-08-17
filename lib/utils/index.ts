/*
  `@/lib/utils` resolves here, so `import { cn } from '@/lib/utils'` keeps working and
  the shadcn alias in `components.json` stays correct.

  Everything re-exported here must be safe in a client bundle. That is why the utils
  that touch server-only or heavy modules — mongoose, `next-intl/server` — import them
  with `import type`, which the compiler erases. The middleware is stricter still and
  imports `./url.utils` directly; see the comment in `proxy.ts`.
*/
export * from './class-name.utils';
export * from './course.utils';
export * from './conversion.utils';
export * from './auth.utils';
export * from './caller.utils';
export * from './error.utils';
export * from './file-signature.utils';
export * from './json-ld.utils';
export * from './material.utils';
export * from './llms.utils';
export * from './notice-labels.utils';
export * from './register-labels.utils';
export * from './login-id.utils';
export * from './mongo.utils';
export * from './navigation.utils';
export * from './notice.utils';
export * from './phone.utils';
export * from './role.utils';
export * from './session.utils';
export * from './schedule.utils';
export * from './schedule-labels.utils';
export * from './schedule.utils';
export * from './url.utils';
export * from './user.utils';
export * from './zod.utils';
