import { LogOut } from 'lucide-react';

import { SESSION } from '@/constants/auth.const';

import { signOutAction } from '@/components/auth/actions';
import { Button } from '@/components/ui';

type SignOutButtonProps = {
  label: string;
  locale: string;
};

/*
  A plain form posting to a server action — no client JavaScript, and it still works
  before hydration.

  The locale travels as a hidden field because `next/root-params` does not resolve
  inside a Server Action, so the action cannot look it up. Without this the redirect
  after signing out would always land on the default language.
*/
export function SignOutButton({ label, locale }: SignOutButtonProps) {
  return (
    <form action={signOutAction}>
      <input type="hidden" name={SESSION.LOCALE_FIELD} value={locale} />

      <Button type="submit" variant="appGhost" size="sm">
        <LogOut className="size-4" />
        {label}
      </Button>
    </form>
  );
}
