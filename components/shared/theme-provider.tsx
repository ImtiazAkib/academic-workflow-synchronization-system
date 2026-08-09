'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

type ThemeProviderProps = {
  children: React.ReactNode;
};

/*
  The `.dark` class on `<html>`, which the palette has been waiting for since step 0 —
  `globals.css` declares a full dark block and `@custom-variant dark (&:is(.dark *))`, and
  until now nothing ever put the class there.

  A thin wrapper rather than using `next-themes` directly in the layout, because the layout
  is a server component and this has to be a client one. Keeping the `'use client'`
  boundary here rather than pushing it up means the layout stays server-rendered and only
  this subtree hydrates.

  `disableTransitionOnChange` matters more than it sounds: without it, every element with a
  `transition-colors` — which is most of them — animates its own change, and
  switching theme becomes a second-long ripple across the page instead of a switch.
*/
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
