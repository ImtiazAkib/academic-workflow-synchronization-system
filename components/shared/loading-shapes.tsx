import { Skeleton } from '@/components/ui';

type LoadingShapeProps = {
  label: string;
};

/*
  Four shapes, because the app has four kinds of screen and one generic skeleton described
  three of eighteen pages. Its own comment claimed the point — "shaped like the page that
  is coming, so nothing jumps on arrival" — and switching from a table to a week grid
  blanked both to the same three bars.

  Each shape carries the whole accessibility envelope itself rather than leaving it to the
  caller: `aria-busy`, a polite live region, and an `sr-only` sentence. That is the part
  easiest to drop when copying a skeleton, and the part a screen reader depends on
  entirely — everything else here is grey rectangles it cannot see.
*/

/**
 * A heading, a line of intro, and a block. What a home screen looks like.
 *
 * @param label - Translated "loading" sentence, announced rather than shown.
 */
export function LoadingPage({ label }: LoadingShapeProps) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>

      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-5 w-full max-w-xl" />
      <Skeleton className="h-20 w-full max-w-2xl" />
    </div>
  );
}

/**
 * A heading, a filter row, and rows of a table.
 *
 * @param label - Translated "loading" sentence, announced rather than shown.
 */
export function LoadingTable({ label }: LoadingShapeProps) {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-full sm:w-44" />
        <Skeleton className="h-10 w-full sm:w-52" />
      </div>

      <div className="border-border flex flex-col gap-px overflow-hidden rounded-lg border">
        {/* Six rows: enough to read as a table, few enough not to imply a count. */}
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-none" />
        ))}
      </div>
    </div>
  );
}

/**
 * A heading and a week of day columns, matching the timetable's own grid.
 *
 * @param label - Translated "loading" sentence, announced rather than shown.
 */
export function LoadingWeek({ label }: LoadingShapeProps) {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {/* The same breakpoints as `schedule-week-view`, so the columns do not re-flow on arrival. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * A heading and a stack of form fields.
 *
 * @param label - Translated "loading" sentence, announced rather than shown.
 */
export function LoadingForm({ label }: LoadingShapeProps) {
  return (
    <div className="flex max-w-3xl flex-col gap-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="border-border flex flex-col gap-5 rounded-lg border p-4 sm:p-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
