import { createNavigation } from 'next-intl/navigation';

import { routing } from './routing';

/*
  Locale-aware navigation. Import `Link`, `redirect`, `usePathname` and `useRouter`
  from here — never from `next/link` or `next/navigation`. Only these wrappers keep
  the `/bn` prefix across a navigation.
*/
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
