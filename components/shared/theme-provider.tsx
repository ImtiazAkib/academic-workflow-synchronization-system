'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { AppTheme } from '@/types';

import { APP_THEMES, THEME_COOKIE_MAX_AGE, THEME_COOKIE_NAME, THEME_STORAGE_KEY } from '@/constants/theme.const';

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
};

type ThemeProviderProps = {
  children: React.ReactNode;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Whether a chosen theme resolves to dark right now — which for `system` is a question
 * only the browser can answer, and only at the moment it is asked.
 *
 * @param theme - The chosen theme.
 *
 * @returns True when the dark palette should apply.
 */
function isDarkFor(theme: AppTheme): boolean {
  return theme === APP_THEMES.DARK || (theme === APP_THEMES.SYSTEM && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

/**
 * Write the resolved theme onto `<html>` and into the cookie the server reads.
 *
 * Three writes, and the cookie is the one that matters beyond this render: it is what lets
 * the next full page load arrive already dark, from the server, with no script and no
 * flash. `dark`/`light` only — never `system`, because the server cannot resolve that, so
 * the resolution is done here and the answer is stored.
 *
 * @param theme - The chosen theme.
 */
function applyTheme(theme: AppTheme): void {
  const root = document.documentElement;
  const dark = isDarkFor(theme);

  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';

  const secure = window.location.protocol === 'https:' ? '; secure' : '';

  document.cookie = `${THEME_COOKIE_NAME}=${dark ? APP_THEMES.DARK : APP_THEMES.LIGHT}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax${secure}`;
}

/**
 * The stored choice, or `system` when there is none or the stored value is junk.
 *
 * Guarded for the server, where there is no `localStorage`. The mismatch this creates —
 * `system` on the server, the real choice on the client — never reaches rendered HTML:
 * the class lives on `<html>` via the cookie, and the one control that shows the choice
 * defers its pressed state until after mount.
 *
 * @returns The theme to start from.
 */
function readStoredTheme(): AppTheme {
  if (typeof window === 'undefined') {
    return APP_THEMES.SYSTEM;
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

  return stored === APP_THEMES.LIGHT || stored === APP_THEMES.DARK || stored === APP_THEMES.SYSTEM ? stored : APP_THEMES.SYSTEM;
}

/**
 * Apply a change with page-wide transitions suppressed for the one frame it takes.
 *
 * Most elements carry `transition-colors`, so without this a theme switch is a
 * second-long ripple across the page rather than a switch. A stylesheet turning every
 * transition off is added, the change is made, a reflow is forced to commit it, and the
 * stylesheet is removed on the next frame — so ordinary hovers keep their transition and
 * only the theme flip skips one.
 *
 * @param change - The write to make while transitions are off.
 */
function withoutTransitions(change: () => void): void {
  const style = document.createElement('style');

  style.appendChild(document.createTextNode('*,*::before,*::after{transition:none !important}'));
  document.head.appendChild(style);

  change();

  // Reading a layout property forces the browser to commit the change before transitions return.
  void document.body.offsetHeight;

  window.requestAnimationFrame(() => document.head.removeChild(style));
}

/*
  The theme, hand-rolled rather than `next-themes`, and script-free by design.

  `next-themes` — and any approach that puts a no-flash `<script>` in the tree — renders
  that script from within the root layout, which re-renders on the client every language
  switch; React 19.2 then errors on the reconciled `<script>` every time. So there is no
  script here at all. The no-flash job is done on the server: the root layout reads the
  theme cookie and ships `<html class="dark">` in the first HTML. This provider's only jobs
  are to hold the choice, apply it on change, and keep that cookie current for the next
  server render. Owning it is the same trade the app already made for authentication.
*/
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<AppTheme>(readStoredTheme);

  /*
    Keep `<html>` in step with the chosen theme, and — while the choice is `system` — with
    the operating system changing under it, so a laptop switching to night mode at sunset
    is followed without a reload. Re-subscribed whenever the choice changes, so the listener
    is only attached while it can matter.
  */
  useEffect(() => {
    applyTheme(theme);

    if (theme !== APP_THEMES.SYSTEM) {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (): void => applyTheme(APP_THEMES.SYSTEM);

    media.addEventListener('change', handleSystemChange);

    return () => media.removeEventListener('change', handleSystemChange);
  }, [theme]);

  /*
    Follow the choice across tabs. Changing the theme in one tab writes `localStorage`,
    which fires a `storage` event in every other tab of the same origin — so they move
    together rather than disagreeing until a reload.
  */
  useEffect(() => {
    const handleStorage = (event: StorageEvent): void => {
      if (event.key === THEME_STORAGE_KEY) {
        setThemeState(readStoredTheme());
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setTheme = (next: AppTheme): void => {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);

    withoutTransitions(() => applyTheme(next));

    setThemeState(next);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

/**
 * Read and change the current theme.
 *
 * @returns The chosen theme and a setter.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
