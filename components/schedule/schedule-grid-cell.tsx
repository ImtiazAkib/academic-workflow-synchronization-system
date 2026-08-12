import { Ban, Clock, Pencil, Trash2, TriangleAlert, User } from 'lucide-react';

import { ClassSessionDto } from '@/types';

import { cn, resolveSemesterLabel } from '@/lib/utils';

import { Badge, Button } from '@/components/ui';

import type { CourseOption, ScheduleLabels, TeacherOption } from './schedule.types';

type ScheduleGridCellProps = {
  session: ClassSessionDto;
  courses: CourseOption[];
  teachers: TeacherOption[];
  labels: ScheduleLabels;
  /** True when this class shares a slot with another of the same teacher - a double-booking. */
  isConflicted: boolean;
  /** Teachers may move and call off their own classes; only an admin may delete one. */
  canManage: boolean;
  canDelete: boolean;
  onEdit: (session: ClassSessionDto) => void;
  onToggleCancel: (session: ClassSessionDto) => void;
  onRemove: (session: ClassSessionDto) => void;
};

/**
 * One class in the week. Shows the course code rather than the id, so the card reads
 * without a lookup - the names come from the same lists the pickers use.
 */
export function ScheduleGridCell({
  session,
  courses,
  teachers,
  labels,
  isConflicted,
  canManage,
  canDelete,
  onEdit,
  onToggleCancel,
  onRemove,
}: ScheduleGridCellProps) {
  const course = courses.find(x => x.courseId === session.courseId);
  const teacherName = teachers.find(x => x.userId === session.teacherId)?.name;

  const handleEditClick = (): void => {
    onEdit(session);
  };

  const handleCancelClick = (): void => {
    onToggleCancel(session);
  };

  const handleRemoveClick = (): void => {
    onRemove(session);
  };

  return (
    <article
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-3',
        isConflicted && !session.isCancelled ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-card'
      )}>
      <div className="flex flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-2">
          {/* Struck through, not hidden: a cancelled class still holds its slot. */}
          <span className={cn('text-regular-semibold', session.isCancelled && 'text-muted-foreground line-through')}>
            {course?.code ?? session.courseId}
          </span>

          {isConflicted && !session.isCancelled && (
            <Badge variant="destructive">
              <TriangleAlert aria-hidden />
              {labels.conflict}
            </Badge>
          )}

          {session.isCancelled && <Badge variant="neutral">{labels.statusCancelled}</Badge>}
        </span>
        {course && <span className="text-muted-foreground line-clamp-2 text-xs">{course.title}</span>}
        <span className="text-muted-foreground text-xs">{resolveSemesterLabel(session.semester)}</span>
      </div>

      <dl className="text-muted-foreground flex flex-col gap-1 text-xs">
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          {/*
            The icon says "time" to somebody who can see it and nothing at all to somebody
            who cannot - so the term is spelled out and hidden visually, matching the
            read-only twin in `student-routine-card.tsx`. Without it this was a `dl` of
            values with no terms: a screen reader read "09:00–10:00" and a bare name.
          */}
          <dt className="sr-only">{labels.timeLabel}</dt>
          <dd className="tabular-nums">
            {session.startTime}–{session.endTime}
          </dd>
        </div>

        {teacherName && (
          <div className="flex items-center gap-1.5">
            <User className="size-3.5 shrink-0" aria-hidden />
            <dt className="sr-only">{labels.fields.teacher}</dt>
            <dd className="truncate">{teacherName}</dd>
          </div>
        )}
      </dl>

      {canManage && (
        <div className="grid grid-cols-2 gap-1.5">
          <Button type="button" variant="outline" size="xs" onClick={handleEditClick}>
            <Pencil className="size-3" />
            {labels.edit}
          </Button>

          <Button type="button" variant="outline" size="xs" onClick={handleCancelClick}>
            <Ban className="size-3" />
            {session.isCancelled ? labels.restore : labels.cancel}
          </Button>

          {canDelete && (
            <Button type="button" variant="outline" size="xs" className="col-span-2" onClick={handleRemoveClick}>
              <Trash2 className="size-3" />
              {labels.remove}
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
