import { z } from 'zod';

import { objectIdField } from './object-id.schema';

/**
 * Deleting an account carries only its id — everything else about the removal is the
 * server's decision, not the caller's. Unlike deactivation, this is irreversible and
 * takes the account's content with it, so the service checks who may do it and to whom
 * before anything is touched.
 */
export const UserDeleteSchema = z.object({
  userId: objectIdField,
});

export type UserDeleteInput = z.input<typeof UserDeleteSchema>;
export type UserDeleteOutput = z.output<typeof UserDeleteSchema>;
