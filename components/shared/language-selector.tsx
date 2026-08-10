'use client';

import { useTransition } from 'react';

import { useLocale } from 'next-intl';

import { I18N } from '@/constants';
import { usePathname, useRouter } from '@/l10n/navigation';
import { AppLocale } from '@/types';

import { cn } from '@/lib/utils';

type LanguageSelectorProps = {
  label: string;
};

export function LanguageSelector({ label }: LanguageSelectorProps) {
  const activeLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLocaleClick = (locale: AppLocale): void => {
    /*
      `pathname` comes back without the locale prefix, so the visitor stays on the page
      they were reading. `router.replace` switches in place — no reload — and sets the
      locale cookie itself, so the choice both takes effect and sticks.

      Wrapped in a transition so `isPending` tracks that switch, which re-renders the whole
      tree on the server: while it is in flight the group dims and its buttons disable, so
      the change is visibly happening and a second language cannot be picked over it.
    */
    startTransition(() => {
      router.replace(pathname, { locale });
    });
  };

  return (
    // h-9 so it matches the sign-out button it always sits beside.
    <div
      role="group"
      aria-label={label}
      aria-busy={isPending}
      className={cn(
        'border-border flex h-9 items-center gap-0.5 rounded-full border p-0.5 transition-opacity',
        isPending && 'pointer-events-none opacity-60'
      )}>
      {I18N.LOCALES.map(x => (
        <button
          key={x.locale}
          type="button"
          lang={x.locale}
          disabled={isPending}
          aria-pressed={x.locale === activeLocale}
          onClick={() => handleLocaleClick(x.locale)}
          className={cn(
            'flex h-full cursor-pointer items-center rounded-full px-2.5 text-sm font-medium transition-colors',
            x.locale === activeLocale ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}>
          {x.nativeName}
        </button>
      ))}
    </div>
  );
}
