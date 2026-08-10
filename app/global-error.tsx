'use client';

import { useSyncExternalStore } from 'react';

import './globals.css';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * A store that never changes, so `useSyncExternalStore` reads the locale once per render
 * with the server and client snapshots it needs to stay hydration-safe — the same use the
 * theme selector puts it to. An effect that set state would trip
 * `react-hooks/set-state-in-effect` and say the same thing one render later.
 *
 * @returns An unsubscribe function that does nothing.
 */
function subscribeToNothing(): () => void {
  return () => undefined;
}

/**
 * The locale carried by the URL — `bn-BD` is served under `/bn`.
 *
 * @returns The active locale, on the client.
 */
function readLocale(): 'en' | 'bn' {
  return window.location.pathname.startsWith('/bn') ? 'bn' : 'en';
}

/*
  The two languages the app ships, inline rather than from `l10n`.

  This is the root global-error boundary: it replaces the whole root layout when rendering
  it throws, so it runs *outside* the next-intl provider and cannot call the translator. Its
  copy therefore lives here, in both languages, flagged for the same review as every other
  Bangla string. (Kept out of `l10n.csv` on purpose — a key there would only mislead, since
  nothing here can read it.)
*/
const COPY = {
  en: {
    title: 'Something went wrong',
    body: 'An unexpected error occurred. Please try again.',
    retry: 'Try again',
  },
  bn: {
    title: 'কিছু একটা ভুল হয়েছে',
    body: 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। আবার চেষ্টা করুন।',
    retry: 'আবার চেষ্টা করুন',
  },
} as const;

export default function GlobalError({ reset }: GlobalErrorProps) {
  /*
    The one locale signal left outside the provider is the URL: `bn-BD` is served under the
    `/bn` prefix (`localePrefix: 'as-needed'`), so the pathname carries it. The server
    snapshot is English and the client snapshot reads the path, so the server and the first
    client render agree — a Bangla page shows English for the blink before hydration, which
    for an error screen is a fair trade for correctness the rest of the time.
  */
  const locale = useSyncExternalStore(subscribeToNothing, readLocale, () => 'en' as const);

  const copy = COPY[locale];

  const handleReset = (): void => {
    reset();
  };

  return (
    <html lang={locale}>
      <body className="bg-background text-foreground font-sans antialiased">
        <section className="flex min-h-dvh items-center justify-center px-4 text-center">
          <div className="flex flex-col items-center gap-6">
            <h2>{copy.title}</h2>

            <p className="text-medium-normal text-muted-foreground max-w-xl">{copy.body}</p>

            <button
              type="button"
              onClick={handleReset}
              className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer rounded-md px-5 py-2 text-sm font-medium">
              {copy.retry}
            </button>
          </div>
        </section>
      </body>
    </html>
  );
}
