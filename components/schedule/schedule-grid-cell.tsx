import { Ban, Clock, Pencil, Trash2, User } from 'lucide-react';

import { ClassSessionDto } from '@/types';

import { cn, resolveSemesterLabel } from '@/lib/utils';

import { Button } from '@/components/ui';

import type { CourseOption, ScheduleLabels, TeacherOption } from './schedule.types';

type ScheduleGridCellProps = {
  session: ClassSessionDto;
  courses: CourseOption[];
  teachers: TeacherOption[];
  labels: ScheduleLabels;
  /** Teachers may move and call off their own classes; only an admin may delete one. */
  canManage: boolean;
  canDelete: boolean;
  onEdit: (session: ClassSessionDto) => void;
  onToggleCancel: (session: ClassSessionDto) => void;
  onRemove: (session: ClassSessionDto) => void;
};

/**
 * One class in the week. Shows the course code rather than the id, so the card reads
 * without a lookup — the names come from the same lists the pickers use.
 */
export function ScheduleGridCell({
  session,
  courses,
  teachers,
  labels,
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
    <article className="border-border bg-card flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-2">
          {/* Struck through, not hidden: a cancelled class still holds its slot. */}
          <span className={cn('text-regular-semibold', session.isCancelled && 'text-muted-foreground line-through')}>
            {course?.code ?? session.courseId}
          </span>
          {session.isCancelled && (
            <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-xs font-medium">{labels.statusCancelled}</span>
          )}
        </span>
        {course && <span className="text-muted-foreground line-clamp-2 text-xs">{course.title}</span>}
        <span className="text-muted-foreground text-xs">{resolveSemesterLabel(session.semester)}</span>
      </div>

      <dl className="text-muted-foreground flex flex-col gap-1 text-xs">
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          <dd>
            {session.startTime}–{session.endTime}
          </dd>
        </div>

        {teacherName && (
          <div className="flex items-center gap-1.5">
            <User className="size-3.5 shrink-0" aria-hidden />
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
