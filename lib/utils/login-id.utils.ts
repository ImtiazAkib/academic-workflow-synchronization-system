import { LOGIN_ID, LOGIN_ID_PATTERN, LOGIN_ID_PREFIXES } from '@/constants/account.const';
import { USER_ROLES } from '@/constants/roles.const';

import type { UserRole } from '@/types';

/**
 * The roles that are issued an identifier. An administrator signs in with their email
 * address, so there is nothing to mint for them.
 */
export type IssuableRole = typeof USER_ROLES.STUDENT | typeof USER_ROLES.TEACHER;

/**
 * Whether this role gets a login identifier at all.
 *
 * A type guard rather than a boolean, so the caller that passes the result on gets the
 * narrowed role and cannot hand `admin` to the generator.
 *
 * @param role - The role to test.
 *
 * @returns True when the role is issued an identifier.
 */
export function isIssuableRole(role: UserRole): role is IssuableRole {
  return role === USER_ROLES.STUDENT || role === USER_ROLES.TEACHER;
}

/**
 * Assemble an identifier from its three parts — `S-2026-0042`.
 *
 * Kept separate from the code that decides *which* number, so the format can be read
 * and tested without a database.
 *
 * @param role - Student or teacher; the role picks the prefix.
 * @param year - The year it is issued in.
 * @param sequence - Position within that role and year, from 1.
 *
 * @returns The formatted identifier.
 */
export function formatLoginId(role: IssuableRole, year: number, sequence: number): string {
  const prefix = LOGIN_ID_PREFIXES[role];
  const padded = String(sequence).padStart(LOGIN_ID.SEQUENCE_PADDING, '0');

  return [prefix, year, padded].join(LOGIN_ID.SEPARATOR);
}

/**
 * Whether a string looks like an issued identifier rather than an email address.
 *
 * Used by sign-in to route one input field to the right lookup without asking the
 * visitor to classify themselves first. It is a shape test, not an existence test — a
 * well-formed identifier nobody holds still resolves to nothing.
 *
 * @param value - The identifier as typed.
 *
 * @returns True when the shape matches.
 */
export function looksLikeLoginId(value: string): boolean {
  return LOGIN_ID_PATTERN.test(value.trim().toUpperCase());
}
