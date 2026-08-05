// Type-only: mongoose must never reach a client bundle through the utils barrel.
import type { Types } from 'mongoose';

/**
 * Render a reference as a plain string id.
 *
 * Accepts both a raw `ObjectId` and a populated document, so a DTO mapper produces
 * the same output whether or not the query happened to populate the reference.
 *
 * @param value - An ObjectId, or a populated document carrying one.
 *
 * @returns The id as a string.
 */
export function toId(value: Types.ObjectId | { _id: Types.ObjectId }): string {
  return typeof value === 'object' && value !== null && '_id' in value ? String(value._id) : String(value);
}
