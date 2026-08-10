import { USER_ROLES } from './roles.const';

// Type-only, so this module stays free of the DTO barrel's runtime imports — it is
// reached from `models/`, which the middleware and the seed scripts also load.
import type { UserRole } from '@/types';

/**
 * The letter that opens a login identifier, per role.
 *
 * Prefixing is what lets a single sign-in field serve both kinds without them sharing a
 * namespace: a student ID and a staff ID cannot collide, so a mistyped identifier fails
 * to resolve rather than resolving to a stranger.
 *
 * Administrators are absent on purpose — they sign in with their email address, and are
 * created by the super administrator rather than issued anything.
 */
export const LOGIN_ID_PREFIXES = {
  [USER_ROLES.STUDENT]: 'S',
  [USER_ROLES.TEACHER]: 'T',
} as const satisfies Partial<Record<UserRole, string>>;

/**
 * `S-2026-0042`: prefix, the year it was issued, then a zero-padded sequence.
 *
 * Four digits is ten thousand accounts per role per year, which a single department
 * will not reach. The year makes the sequence restart annually rather than climbing
 * forever, and makes an identifier legible at a glance.
 */
export const LOGIN_ID = {
  SEQUENCE_PADDING: 4,
  SEPARATOR: '-',
  /**
   * How many times to retry after a duplicate. The sequence is derived from a count and
   * the write is separate, so two registrations verifying in the same instant can pick
   * the same number — the unique index refuses the second, and it tries again.
   */
  MAX_ATTEMPTS: 5,
} as const;

/**
 * Matches an issued identifier, so sign-in can tell one from an email address without
 * asking the visitor which they are typing.
 */
export const LOGIN_ID_PATTERN = /^[ST]-\d{4}-\d{4}$/;

export const EMAIL_VERIFICATION = {
  /** 32 bytes of `randomBytes`, hex-encoded — 64 characters in the link. */
  TOKEN_BYTES: 32,
  /**
   * A day to click the link. Long enough for an email that sat in a spam folder
   * overnight, short enough that a leaked inbox from last month is not an account.
   */
  LIFETIME_HOURS: 24,
  /**
   * How long after issuing a link before another may be asked for.
   *
   * A throttle that needs no memory and no shared store: the existing token already
   * records when it was minted, so "you asked a moment ago" is a question the database
   * can answer. An in-memory counter would reset on every deploy and count separately
   * per instance; this behaves the same on one server or ten.
   *
   * Short enough that somebody who genuinely mistyped their address is not stuck, long
   * enough that the endpoint cannot be used to send somebody a message per second.
   */
  RESEND_COOLDOWN_MINUTES: 2,
} as const;

/**
 * The departments an account may belong to.
 *
 * One entry for now — the proposal is explicit that this is a single department — but a
 * list rather than a bare string, so the registration and admin forms offer a dropdown
 * instead of a free-text box that invites five spellings of the same department. Adding a
 * second one later is a line here; the stored value is the label, so no mapping is needed
 * and it reads the same in both languages the app ships.
 */
export const DEPARTMENTS = ['ICT'] as const;

export type Department = (typeof DEPARTMENTS)[number];

/**
 * Bounds on the departmental fields registration collects. Deliberately generous: these
 * are typed by the applicant and corrected by an administrator at approval, so the
 * schema is stopping abuse rather than enforcing a format nobody agreed on yet.
 */
export const ACCOUNT_FIELD_LIMITS = {
  ROLL: 40,
  REGISTRATION_NO: 40,
  SESSION: 20,
  DEPARTMENT: 120,
  ADDRESS: 200,
} as const;
