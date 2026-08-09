import mongoose, { Model, Schema, Types } from 'mongoose';

/*
  Models import the constant module directly rather than the `@/constants` barrel.
  The barrel re-exports `home.const.ts`, which pulls in `lucide-react` — fine in a
  React tree, dead weight in a seed script and fatal in the middleware bundle.
*/
import { RATE_LIMIT_COLLECTION } from '@/constants/rate-limit.const';

export type RateLimitAttributes = {
  /**
   * What is being counted, as `scope:hash`.
   *
   * Hashed, never raw. The things worth limiting are identifiers, email addresses and
   * network addresses — all of which are personal data with their own retention story,
   * and none of which this collection needs to be able to read back. It only ever asks
   * "have I seen this exact key before", which a digest answers as well as the value.
   *
   * The scope prefix keeps two budgets for the same person apart: somebody who has used
   * up their registration attempts has not thereby used up their sign-in attempts.
   */
  key: string;
  hits: number;
  /**
   * When the current window opened.
   *
   * The window is computed from this rather than inferred from the document existing,
   * and that distinction is load-bearing: mongod's TTL monitor sweeps about once a
   * minute, so an expired document is routinely still present. Reading the date means a
   * stale row is treated as the empty window it represents, instead of as a live one.
   */
  windowStartedAt: Date;
  /** When the row may be swept. The TTL index below does the sweeping. */
  expiresAt: Date;
};

export type RateLimitEntity = RateLimitAttributes & { _id: Types.ObjectId };

type RateLimitModel = Model<RateLimitAttributes>;

const rateLimitSchema = new Schema<RateLimitAttributes, RateLimitModel>(
  {
    key: { type: String, required: true, unique: true, trim: true, maxlength: 200 },
    hits: { type: Number, required: true, default: 0, min: 0 },
    windowStartedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: false, collection: RATE_LIMIT_COLLECTION }
);

/*
  The collection cleans itself. Without this it grows by one document per distinct caller
  per window forever — a limiter that becomes the storage problem it was added to prevent.

  `expireAfterSeconds: 0` means "sweep once `expiresAt` is in the past" rather than "keep
  for zero seconds"; the field carries the deadline.
*/
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Guarded so hot reload re-uses the compiled model instead of redefining it.
export const RateLimit =
  (mongoose.models.RateLimit as RateLimitModel) ?? mongoose.model<RateLimitAttributes, RateLimitModel>('RateLimit', rateLimitSchema);
