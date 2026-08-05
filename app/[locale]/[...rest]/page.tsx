import { notFound } from 'next/navigation';

/*
  Catch-all for unmatched paths inside a locale. Without it, `/bn/nope` escapes the
  `[locale]` segment and Next falls back to its own unstyled 404 — this keeps the
  not-found page inside the locale layout, translated and in the site's shell.
*/
export default function CatchAllPage() {
  notFound();
}
