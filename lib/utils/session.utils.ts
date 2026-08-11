import { SESSION_START_YEAR } from '@/constants/account.const';

/**
 * The intake sessions the dropdowns offer, `2020-21` up to the current calendar year.
 *
 * Newest first: the session somebody is choosing is almost always the current one or the
 * one just before it, and a list opening on 2020 makes them scroll past six years to reach
 * it. The range ends at the current year, so 2027 brings `2027-28` along on its own with no
 * edit here.
 *
 * The clock is a defaulted parameter rather than read inside — the caller owns the clock,
 * the way `resolveDepartmentToday` does, so a test can pin it. Rendering with `new Date()`
 * in a client component is hydration-safe: the calendar year is the same on the server and
 * in the browser.
 *
 * @param now - The moment to read the current year from.
 *
 * @returns The session values, newest first — e.g. `['2026-27', …, '2020-21']`.
 */
export function buildSessionValues(now: Date = new Date()): string[] {
  const currentYear = now.getFullYear();
  const values: string[] = [];

  for (let year = SESSION_START_YEAR; year <= currentYear; year++) {
    values.push(`${year}-${String((year + 1) % 100).padStart(2, '0')}`);
  }

  return values.reverse();
}
