import { SESSION } from '@/constants/auth.const';

import { signOutAction } from '@/components/auth/actions';

import { SignOutSubmit } from './sign-out-submit';

type SignOutButtonProps = {
  label: string;
  workingLabel: string;
  locale: string;
};

/*
  A plain form posting to a server action — it still works before hydration, and the
  submit button carries the pending feedback once it has (see `SignOutSubmit`).

  The locale travels as a hidden field because `next/root-params` does not resolve
  inside a Server Action, so the action cannot look it up. Without this the redirect
  after signing out would always land on the default language.
*/
export function SignOutButton({ label, workingLabel, locale }: SignOutButtonProps) {
  return (
    <form action={signOutAction}>
      <input type="hidden" name={SESSION.LOCALE_FIELD} value={locale} />

      <SignOutSubmit label={label} workingLabel={workingLabel} />
    </form>
  );
}
