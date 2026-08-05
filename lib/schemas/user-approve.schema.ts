import { z } from 'zod';

import { objectIdField } from './object-id.schema';

/**
 * Approval and revocation share a schema — the difference is the boolean, so the
 * admin screen can undo a mistaken approval through the same path.
 */
export const UserApproveSchema = z.object({
  userId: objectIdField,
  isApproved: z.boolean(),
});

export type UserApproveInput = z.input<typeof UserApproveSchema>;
export type UserApproveOutput = z.output<typeof UserApproveSchema>;
