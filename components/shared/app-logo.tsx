import { APP_DATA } from '@/constants';

import { cn } from '@/lib/utils';

type AppLogoProps = {
  className?: string;
};

/*
  Drawn inline rather than shipped as an image file, so the mark stays crisp at every
  size and the app has no binary dependency. `app/icon.svg` is the same artwork.
*/
export function AppLogo({ className }: AppLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={APP_DATA.LOGO.IMAGE_ALT}
      className={cn('size-10', className)}>
      <defs>
        <linearGradient id="app-logo-gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4f46e5" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>

      <rect width="64" height="64" rx="16" fill="url(#app-logo-gradient)" />

      {/* Mortarboard */}
      <path d="M32 17 52 26 32 35 12 26Z" fill="#fff" />

      {/* Class group under the cap — the part that stays in sync */}
      <path d="M21 30v8.5c0 3.6 4.9 6.5 11 6.5s11-2.9 11-6.5V30" stroke="#fff" strokeOpacity="0.85" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="49" cy="30" r="2.6" fill="#fff" />
    </svg>
  );
}
