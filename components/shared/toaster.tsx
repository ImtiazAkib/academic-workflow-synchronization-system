'use client';

import { Toaster as SonnerToaster, type ToasterProps } from 'sonner';

import { useTheme } from '@/components/shared/theme-provider';

/*
  The app's toaster: sonner restyled to the design tokens rather than its own loud
  `richColors` palette (R2a). The surface is painted from the popover tokens (via sonner's
  `--normal-*` variables) so it tracks light/dark with the rest of the app, and the four
  status accents map to --success/--destructive/--warning/--info. `theme` is threaded from the
  app's own theme so sonner's internal defaults agree with the token surface. Rendered once,
  from the dashboard layout.
*/
function Toaster(props: ToasterProps) {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme}
      position="top-right"
      closeButton
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--success-text': 'var(--success)',
          '--error-text': 'var(--destructive)',
          '--warning-text': 'var(--warning)',
          '--info-text': 'var(--info)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
