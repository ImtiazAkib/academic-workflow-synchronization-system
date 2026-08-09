import { RateLimit } from '@/models/rate-limit.model';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';

import { hashToken } from './token.hash';

const log = createLoggerWithContext('rate-limit.guard');

/**
 * A budget: this many attempts inside this window, per key.
 */
export type RateLimitBudget = {
  LIMIT: number;
  WINDOW_MINUTES: number;
};

/*
  The application's one rate limiter.

  **The counts live in the database, not in memory**, and the reason is already written
  down in `EMAIL_VERIFICATION`: "an in-memory counter would reset on every deploy and
  count separately per instance; this behaves the same on one server or ten." That
  argument does not stop being true because the counter moved — a `Map` on `globalThis`
  would be free and would even be correct on the PM2 box today, which runs a single
  forked process, but the project ships a Vercel target as well, where every function is
  its own isolate. A limiter that only holds on one of the two deployments is a bug that
  passes every local test.

  **Not in `proxy.ts`**, and that is a hard constraint before it is a preference. The
  proxy runs in the middleware runtime, where Mongoose does not load at all — its own
  comments say as much. It also cannot see what needs limiting: sign-in, registration and
  the resend are Server Actions, which POST to the same URL as the page that rendered
  them and are told apart only by an opaque per-build header. There is no path to match
  on. The proxy's comment already draws the line: "This is a perimeter, not the control."
  A limit is a control.

  **One round trip, and it has to be.** `findOneAndUpdate` with `$inc` and `$setOnInsert`
  is atomic at the document, so two requests arriving together increment the same counter
  rather than each reading zero and writing one. A read-then-write would be a race with a
  free extra attempt in it.
*/

/**
 * Count one attempt against a budget, and say whether it is allowed.
 *
 * Fails **open** on a database error, deliberately. A limiter is a guard on top of a
 * control, never the control itself — the sign-in still checks the password and the
 * upload still checks the role. Refusing everybody because the counter could not be read
 * would turn a database blip into an outage of the whole application, which is a worse
 * failure than briefly not throttling.
 *
 * @param scope - Which budget this is, so two limits on one person stay apart.
 * @param identity - Who or what is being counted — an identifier, an address, a user id.
 * @param budget - How many attempts, and over how long.
 *
 * @returns True when the attempt may proceed.
 */
export async function consumeRateLimit(scope: string, identity: string, budget: RateLimitBudget): Promise<boolean> {
  try {
    await connectToDatabase();

    const now = Date.now();
    const windowMs = budget.WINDOW_MINUTES * 60 * 1000;

    const record = await RateLimit.findOneAndUpdate(
      { key: buildKey(scope, identity) },
      {
        $inc: { hits: 1 },
        $setOnInsert: { windowStartedAt: new Date(now), expiresAt: new Date(now + windowMs) },
      },
      { upsert: true, returnDocument: 'after' }
    ).lean<{ hits: number; windowStartedAt: Date } | null>();

    if (!record) {
      return true;
    }

    /*
      A row whose window has already closed is the empty window it represents, not a full
      one. It is read rather than trusted to be gone because the TTL monitor sweeps on its
      own schedule — roughly once a minute — so an expired document is routinely still
      here, and treating its `hits` as current would lock somebody out for as long as the
      sweep took to come round.

      Reset rather than deleted: the same caller is about to be counted again, and a write
      that reuses the row is one round trip where a delete plus an insert is two.
    */
    if (record.windowStartedAt.getTime() + windowMs <= now) {
      await RateLimit.updateOne({ key: buildKey(scope, identity) }, { hits: 1, windowStartedAt: new Date(now), expiresAt: new Date(now + windowMs) });

      return true;
    }

    return record.hits <= budget.LIMIT;
  } catch (error) {
    log.error({ err: error, scope }, 'Rate limit check failed, allowing the request');

    return true;
  }
}

/**
 * Forget a key's attempts.
 *
 * What makes a failure-counted budget humane: somebody who mistypes twice and then signs
 * in successfully is back to a full allowance, rather than carrying two used attempts
 * around for the rest of the window.
 *
 * @param scope - Which budget to clear.
 * @param identity - Whose attempts to forget.
 */
export async function resetRateLimit(scope: string, identity: string): Promise<void> {
  try {
    await connectToDatabase();

    await RateLimit.deleteOne({ key: buildKey(scope, identity) });
  } catch (error) {
    log.error({ err: error, scope }, 'Clearing a rate limit failed');
  }
}

/**
 * The stored key for a scope and an identity.
 *
 * The identity is hashed and lowercased first. Lowercased so `S-2026-0042` and
 * `s-2026-0042` are one caller rather than two allowances; hashed so this collection
 * never becomes a second place the application keeps addresses.
 *
 * @param scope - Budget name.
 * @param identity - Raw identity.
 *
 * @returns The key to count against.
 */
function buildKey(scope: string, identity: string): string {
  return `${scope}:${hashToken(identity.trim().toLowerCase())}`;
}
