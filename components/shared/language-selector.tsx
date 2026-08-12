'use client';

import { useTransition } from 'react';

import { Check, Languages } from 'lucide-react';
import { useLocale } from 'next-intl';

import { I18N } from '@/constants';
import { usePathname, useRouter } from '@/l10n/navigation';
import { AppLocale } from '@/types';

import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui';

type LanguageSelectorProps = {
  label: string;
};

/*
  A compact icon trigger opening a menu of the languages, rather than a row of full-width name
  buttons — English + বাংলা side by side were the widest thing in the topbar and pushed it past a
  phone's width. The menu still names each language in its own script; the active one carries a
  check. Switching stays a `router.replace` in a transition so the choice takes effect in place,
  sets the cookie, and disables the trigger while the tree re-renders for the new locale.
*/
export function LanguageSelector({ label }: LanguageSelectorProps) {
  const activeLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLocaleClick = (locale: AppLocale): void => {
    startTransition(() => {
      router.replace(pathname, { locale });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={label} aria-busy={isPending} disabled={isPending} />}>
        <Languages />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-40">
        {I18N.LOCALES.map(x => (
          <DropdownMenuItem key={x.locale} lang={x.locale} onClick={() => handleLocaleClick(x.locale)}>
            <span className="flex-1">{x.nativeName}</span>

            {x.locale === activeLocale && <Check />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
