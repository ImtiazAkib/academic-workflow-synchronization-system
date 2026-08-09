'use client';

import { useSyncExternalStore } from 'react';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/utils';

export type ThemeSelectorLabels = {
  group: string;
  light: string;
  dark: string;
  system: string;
};

type ThemeSelectorProps = {
  labels: ThemeSelectorLabels;
};

/**
 * A store that never changes, so `useSyncExternalStore` is only being used for the one
 * thing it answers precisely: the server snapshot differs from the client one, which is
 * exactly "has this hydrated yet". An effect that set state would say the same thing one
 * render later and is what `react-hooks/set-state-in-effect` exists to discourage.
 *
 * @returns An unsubscribe function that does nothing.
 */
function subscribeToNothing(): () => void {
  return () => undefined;
}

/*
  Three choices rather than a two-state switch, and the third is the one worth having:
  "system" is what somebody who has already told their phone to go dark at sunset means,
  and a toggle without it makes them state the preference twice.

  Shaped like `LanguageSelector` on purpose — same pill, same height, same `aria-pressed`
  group — because the two sit side by side and a visitor should read them as one row of
  controls rather than two widgets from different apps.
*/
export function ThemeSelector({ labels }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  /*
    The server cannot know the theme: it lives in `localStorage` and in the operating
    system, neither of which exists while the HTML is being rendered. So the first client
    render must match the server's — which means rendering the buttons unpressed until
    after mount, and only then showing which one is active.

    Without this the markup disagrees with itself and React logs a hydration mismatch. The
    buttons still work before mount; only the pressed state waits.
  */
  const hasMounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  );

  const options = [
    { value: 'light', label: labels.light, icon: Sun },
    { value: 'dark', label: labels.dark, icon: Moon },
    { value: 'system', label: labels.system, icon: Monitor },
  ];

  const handleThemeClick = (value: string): void => {
    setTheme(value);
  };

  return (
    // h-9 so it matches the language selector and the sign-out button it sits beside.
    <div role="group" aria-label={labels.group} className="border-border flex h-9 items-center gap-0.5 rounded-full border p-0.5">
      {options.map(x => (
        <button
          key={x.value}
          type="button"
          // The name is the label, because the icon alone says nothing to a screen reader.
          aria-label={x.label}
          title={x.label}
          aria-pressed={hasMounted && theme === x.value}
          onClick={() => handleThemeClick(x.value)}
          className={cn(
            'flex h-full cursor-pointer items-center rounded-full px-2.5 transition-colors',
            hasMounted && theme === x.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}>
          <x.icon className="size-4" aria-hidden />
        </button>
      ))}
    </div>
  );
}
