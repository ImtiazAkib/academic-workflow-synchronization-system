import { MAIN_CONTENT_ID } from '@/constants/a11y.const';

type SkipToContentProps = {
  label: string;
};

/**
 * The first thing in the tab order, and off-screen until it has focus.
 *
 * A dashboard screen puts up to seventeen links and buttons between the top of the page
 * and the content - the brand link, seven nav entries, three theme buttons, two language
 * buttons, sign-out, and then the seven nav entries again in the mobile bar. Somebody
 * navigating by keyboard had to walk all of them on every single page load, and WCAG 2.4.1
 * has no other mechanism that would satisfy it here.
 *
 * **Parked above the viewport rather than hidden with `sr-only`.** The usual idiom is
 * `sr-only focus:not-sr-only`, which does work here - that was checked rather than
 * assumed. It is avoided because of how it fails: `sr-only` sets five declarations and
 * `not-sr-only` has to win every one of them back, so a single conflicting utility leaves
 * the link clipped while focused, which is precisely the state it exists to escape. That
 * failure is invisible to anybody not tabbing through the page. Here one property does
 * the work, and the link is an ordinary visible element that happens to sit out of frame.
 *
 * A plain anchor rather than the `Link` from `@/l10n/navigation`: the target is a fragment
 * on the page already open, so there is no locale to preserve and no navigation to make.
 *
 * @param label - Translated link text.
 */
export function SkipToContent({ label }: SkipToContentProps) {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="bg-background text-foreground focus-visible:ring-ring absolute -top-16 left-3 z-50 rounded-md px-4 py-2 text-sm font-medium shadow-lg transition-[top] focus:top-3 focus-visible:ring-2">
      {label}
    </a>
  );
}
