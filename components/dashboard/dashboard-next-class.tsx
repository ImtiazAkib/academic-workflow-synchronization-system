import { CalendarCheck } from 'lucide-react';

import { cn, resolveSemesterLabel } from '@/lib/utils';

import { Badge, EmptyState } from '@/components/ui';

import type { ClassSessionDto } from '@/types';

type DashboardNextClassProps = {
  /** The class to feature - the one on now, else the next one today, else null. */
  session: ClassSessionDto | null;
  /** `now` when the featured class is in progress, `next` when it is still to start. */
  kind: 'now' | 'next' | null;
  course?: { code: string; title: string };
  /** Shown on the student view (whose class it is); omitted for a teacher (it is theirs). */
  teacherName?: string;
  labels: { now: string; nextIn: string | null; emptyTitle: string; emptyDescription: string };
};

/*
  The "what's next" hero (R4): the single class a teacher or student most needs to see - the one on
  now, or the next one today - made unmistakable at the top of their home. A live class gets the
  navy tint and a "Now" badge; the next one carries its "in X min". When the day's classes are done
  it says so plainly rather than leaving a blank.
*/
export function DashboardNextClass({ session, kind, course, teacherName, labels }: DashboardNextClassProps) {
  if (!session || !kind) {
    return <EmptyState icon={CalendarCheck} title={labels.emptyTitle} description={labels.emptyDescription} />;
  }

  const meta = [teacherName, resolveSemesterLabel(session.semester)].filter(Boolean).join(' · ');

  return (
    <div
      className={cn('flex flex-col gap-3 rounded-lg border p-4', kind === 'now' ? 'border-primary/40 bg-primary-muted/40' : 'border-border bg-card')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant={kind === 'now' ? 'success' : 'info'}>{kind === 'now' ? labels.now : labels.nextIn}</Badge>

        <span className="text-muted-foreground text-sm tabular-nums">
          {session.startTime}–{session.endTime}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-card-title">{course?.code ?? session.courseId}</span>

        {course?.title && <span className="text-muted-foreground text-sm">{course.title}</span>}

        {meta && <span className="text-muted-foreground text-xs">{meta}</span>}
      </div>
    </div>
  );
}
