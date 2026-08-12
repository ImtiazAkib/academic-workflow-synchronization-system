'use client';

import { useSyncExternalStore } from 'react';

import { Check, Monitor, Moon, Sun } from 'lucide-react';

import { AppTheme } from '@/types';

import { APP_THEMES } from '@/constants/theme.const';

import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui';

import { useTheme } from './theme-provider';

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
  A compact icon trigger opening a menu of the three choices, rather than a three-button pill
  group - so it costs one control's width in the bar instead of three, which is what let the
  topbar stop overflowing on a phone. "System" is kept as the third choice: it is what someone
  who told their phone to go dark at sunset means, and a light/dark toggle makes them say it twice.

  The server cannot know the theme (it lives in localStorage / the OS), so the trigger shows a
  neutral icon until mount and only then the active one - the same hydration guard the pill group
  used for its pressed state, kept here so the markup does not disagree with itself.
*/
export function ThemeSelector({ labels }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  const hasMounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  );

  const options: { value: AppTheme; label: string; icon: typeof Sun }[] = [
    { value: APP_THEMES.LIGHT, label: labels.light, icon: Sun },
    { value: APP_THEMES.DARK, label: labels.dark, icon: Moon },
    { value: APP_THEMES.SYSTEM, label: labels.system, icon: Monitor },
  ];

  const handleThemeClick = (value: AppTheme): void => {
    setTheme(value);
  };

  // Monitor until mount, so server and the first client render agree; the real icon follows.
  const TriggerIcon = hasMounted ? (options.find(x => x.value === theme)?.icon ?? Monitor) : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={labels.group} />}>
        <TriggerIcon />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-40">
        {options.map(x => (
          <DropdownMenuItem key={x.value} onClick={() => handleThemeClick(x.value)}>
            <x.icon />

            <span className="flex-1">{x.label}</span>

            {hasMounted && theme === x.value && <Check />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
