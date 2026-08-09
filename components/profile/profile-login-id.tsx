'use client';

import { useState } from 'react';

import { Copy, KeyRound } from 'lucide-react';

import { Button } from '@/components/ui';

import type { ProfileLoginIdLabels } from './profile.types';

type ProfileLoginIdProps = {
  loginId: string | null;
  labels: ProfileLoginIdLabels;
};

/*
  At the top of the profile and deliberately the largest thing on it.

  The identifier is shown once, on the screen that follows a confirmation link, and mailed
  once. Both of those are moments somebody moves past quickly — a tab gets closed, an inbox
  gets filtered — and after them there is no other way to learn what opens the account.
  This is where somebody comes when they cannot find that message, so it has to be the
  first thing they see rather than a row in a table of details.

  Read-only, and there is no version of this screen where it is not. The identifier is
  issued by the application at the moment an address is proven; an account that could
  choose its own would be an account that could choose somebody else's.

  A client component only for the copy button. `navigator.clipboard` needs a browser, and
  the identifier is long enough and unusual enough that retyping it is how it gets typed
  wrong.
*/
export function ProfileLoginId({ loginId, labels }: ProfileLoginIdProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyClick = (): void => {
    if (!loginId) {
      return;
    }

    navigator.clipboard.writeText(loginId).then(() => {
      setIsCopied(true);
    });
  };

  return (
    <section className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-lg">
          <KeyRound className="text-muted-foreground size-4 shrink-0" aria-hidden />
          {labels.title}
        </h2>
        <p className="text-muted-foreground text-sm">{labels.description}</p>
      </div>

      {/*
        Administrators reach this screen too, and hold no identifier at all — they sign in
        with their email address. Saying so is better than an empty box, which reads as
        something that failed to load.
      */}
      {loginId ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="border-border bg-muted/40 flex-1 rounded-lg border px-4 py-3 font-mono text-xl font-bold tracking-widest">{loginId}</p>

          <Button type="button" variant="outline" size="sm" className="sm:self-stretch" onClick={handleCopyClick}>
            <Copy className="size-3.5" />
            {isCopied ? labels.copied : labels.copy}
          </Button>
        </div>
      ) : (
        <p className="border-border text-muted-foreground rounded-lg border border-dashed px-4 py-3 text-sm">{labels.empty}</p>
      )}
    </section>
  );
}
