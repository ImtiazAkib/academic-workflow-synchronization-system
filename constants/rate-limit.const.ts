/**
 * How long a refused caller is told to wait, in seconds.
 *
 * One number for every limit, because it is a hint rather than a promise — the window is
 * what actually decides, and a per-endpoint `Retry-After` would leak how each budget is
 * tuned to anybody probing them.
 */
export const RATE_LIMIT_RETRY_AFTER_SECONDS = 60;

/**
 * The collection the counters live in.
 *
 * A collection rather than a field on the row being guarded, unlike the resend cooldown
 * in `EMAIL_VERIFICATION`. That trick works because the operation it guards already owns
 * a dated row; sign-in and registration write no such timestamp, and registration has no
 * row at all until it succeeds — which is the request that needs bounding.
 */
export const RATE_LIMIT_COLLECTION = 'ratelimits';

/**
 * Every budget in the application, as `{ LIMIT, WINDOW_MINUTES }`.
 *
 * A budget is "this many attempts per window, per key", and the key differs per entry —
 * see each one. They are separate constants rather than one shared number because the
 * thing being protected differs: sign-in is protecting a password, the uploads are
 * protecting a disk, and registration is protecting somebody else's mail reputation.
 */
export const RATE_LIMIT = {
  /**
   * Failed sign-in attempts, per identifier as typed.
   *
   * Five is enough for somebody who genuinely cannot remember which of two passwords
   * they used, and far short of useful for a spray: login IDs are enumerable by
   * construction — `S-2026-0001` upward are all real — so an attacker needs no discovery
   * phase and a generous limit here would be an invitation.
   *
   * Only failures count and a success clears the record, so the person who mistypes once
   * and then gets it right is never nearer the limit than when they started.
   *
   * Fifteen minutes rather than an hour: this is a speed bump against automation, not a
   * lockout. A lockout keyed on a guessable identifier is a denial-of-service handed to
   * anybody who can count.
   */
  SIGN_IN: { LIMIT: 5, WINDOW_MINUTES: 15 },

  /**
   * Registrations per caller.
   *
   * Each one costs a bcrypt hash, a row and an outbound message from the department's own
   * relay — so an unbounded endpoint spends somebody else's sending reputation. Three an
   * hour is more than a real applicant needs and far less than a flood.
   */
  REGISTER: { LIMIT: 3, WINDOW_MINUTES: 60 },

  /**
   * Confirmation resends per caller.
   *
   * The account-level cooldown in `EMAIL_VERIFICATION.RESEND_COOLDOWN_MINUTES` already
   * stops one address being mailed repeatedly. This is the other dimension: one script
   * walking five hundred addresses, each of which is individually within its cooldown.
   */
  RESEND: { LIMIT: 5, WINDOW_MINUTES: 60 },

  /**
   * Uploads per signed-in account.
   *
   * Keyed on the account rather than the caller, because these endpoints require a
   * session — a user id is a fact the server issued, where a forwarded address is a
   * header somebody may be able to set. Twenty files an hour is a heavy but plausible
   * teaching week; the bytes behind it are what fills the same database every other
   * feature depends on.
   */
  UPLOAD: { LIMIT: 20, WINDOW_MINUTES: 60 },
} as const;
