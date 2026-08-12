import { cn, resolveSemesterLabel } from '@/lib/utils';

import { Badge } from '@/components/ui';

import type { ClassSessionDto } from '@/types';

type DashboardClassRowProps = {
  session: ClassSessionDto;
  courseCode: string;
  courseTitle?: string;
  /** The teacher's name — shown on the admin and student views, omitted on a teacher's own list. */
  teacherName?: string;
  /** `current` tints the whole row (the class on now); `next` just carries its badge. */
  highlight?: 'current' | 'next' | null;
  /** Pre-formatted status text ("Now" / "in 25 min"), resolved by the caller which holds the translator. */
  statusLabel?: string | null;
  labels: { cancelled: string };
};

/*
  One class in a dashboard's "today" list (R4): a read-only row — time, course, who and which
  year — with the human-touch marker the brief asks for, "Now" on the class in progress and
  "in 25 min" on the one up next. Deliberately not the schedule grid's ScheduleGridCell, which
  carries edit/cancel/delete buttons; a dashboard only reports. A cancelled class keeps its slot,
  struck through with a quiet badge, because a gap and a called-off class are not the same news.
*/
export function DashboardClassRow({ session, courseCode, courseTitle, teacherName, highlight, statusLabel, labels }: DashboardClassRowProps) {
  const meta = [teacherName, resolveSemesterLabel(session.semester)].filter(Boolean).join(' · ');

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3',
        highlight === 'current' ? 'border-primary/30 bg-primary-muted/40' : 'border-border bg-card'
      )}>
      <span className="text-muted-foreground w-18 shrink-0 text-xs tabular-nums">
        {session.startTime}
        <br />
        {session.endTime}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-2">
          <span className={cn('text-sm font-medium', session.isCancelled && 'text-muted-foreground line-through')}>{courseCode}</span>

          {statusLabel && !session.isCancelled && <Badge variant={highlight === 'current' ? 'success' : 'info'}>{statusLabel}</Badge>}

          {session.isCancelled && <Badge variant="neutral">{labels.cancelled}</Badge>}
        </span>

        {courseTitle && <span className="text-muted-foreground truncate text-xs">{courseTitle}</span>}

        {meta && <span className="text-muted-foreground truncate text-xs">{meta}</span>}
      </div>
    </div>
  );
}
