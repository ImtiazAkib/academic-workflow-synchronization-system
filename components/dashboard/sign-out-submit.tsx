'use client';

import { LogOut } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { Button, Spinner } from '@/components/ui';

type SignOutSubmitProps = {
  label: string;
  workingLabel: string;
};

/*
  The submit button lifted out of the sign-out form so it can read `useFormStatus`, which
  only a component rendered inside the form can see. While the server action clears the
  session cookie and redirects, `pending` is true — the button disables and swaps its icon
  for a spinner and its label for "Signing out…", so a slow round trip cannot be clicked a
  second time and never leaves the user unsure the first click registered.

  A hair of client JavaScript on top of the plain form, not a replacement for it: the form
  still posts and still works before this hydrates. Only the pending feedback waits.
*/
export function SignOutSubmit({ label, workingLabel }: SignOutSubmitProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending} aria-busy={pending}>
      {pending ? <Spinner className="size-4" /> : <LogOut className="size-4" />}
      {pending ? workingLabel : label}
    </Button>
  );
}
