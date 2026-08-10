import { AppTheme } from '@/types';

/**
 * Where the *choice* lives — `light`, `dark`, or `system`. Client-only, because the
 * toggle and the system-preference tracking are client-only; the server never needs to
 * know whether a dark render was chosen outright or resolved from the operating system.
 */
export const THEME_STORAGE_KEY = 'theme';

/**
 * Where the *resolved* theme lives — `dark` or `light`, never `system`.
 *
 * A cookie rather than only `localStorage` because the server reads it: the root layout
 * sets the `.dark` class on `<html>` from this, so a dark visitor's first paint is dark
 * with no script and no flash. `localStorage` is not sent with the request; a cookie is.
 * The client writes it whenever it applies a theme, so the next server render matches what
 * the last client render showed.
 */
export const THEME_COOKIE_NAME = 'academic.theme';

/** A year, matching the locale cookie. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const APP_THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const satisfies Record<string, AppTheme>;
