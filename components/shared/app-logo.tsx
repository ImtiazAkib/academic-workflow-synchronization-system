import Image from 'next/image';

import { APP_DATA } from '@/constants';

import { cn } from '@/lib/utils';

type AppLogoProps = { className?: string; label?: string };

/** The generated ASW brand mark used across the public site and workspace shell. */
export function AppLogo({ className, label = APP_DATA.LOGO.IMAGE_ALT }: AppLogoProps) {
  return <Image src="/brand/asw-logo.webp" alt={label} width={1254} height={1254} className={cn('size-10 object-contain', className)} />;
}
