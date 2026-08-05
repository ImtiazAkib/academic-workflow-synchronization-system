import { z } from 'zod';

import { objectIdField } from './object-id.schema';

/**
 * Activation and deactivation share a schema, the same way approval does — the
 * difference is the boolean. Accounts are switched off rather than deleted, so
 * schedules and materials keep a valid author.
 */
export const UserActivateSchema = z.object({
  userId: objectIdField,
  isActive: z.boolean(),
});

export type UserActivateInput = z.input<typeof UserActivateSchema>;
export type UserActivateOutput = z.output<typeof UserActivateSchema>;
