'use client';

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

  const handleLocaleClick = (locale: AppLocale): void => {
    // `pathname` comes back without the locale prefix, so the visitor stays on the
    // page they were reading instead of being dropped on the home page.
    router.replace(pathname, { locale });
  };

  return (
    // h-9 so it matches the sign-out button it always sits beside.
    <div role="group" aria-label={label} className="border-border flex h-9 items-center gap-0.5 rounded-full border p-0.5">
      {I18N.LOCALES.map(x => (
        <button
          key={x.locale}
          type="button"
          lang={x.locale}
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
