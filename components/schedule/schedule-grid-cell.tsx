import { Clock, MapPin, Pencil, Trash2, User } from 'lucide-react';

import { ClassSessionDto } from '@/types';

import { Button } from '@/components/ui';

import type { CourseOption, ScheduleLabels, TeacherOption } from './schedule.types';

type ScheduleGridCellProps = {
  session: ClassSessionDto;
  courses: CourseOption[];
  teachers: TeacherOption[];
  labels: ScheduleLabels;
  isReadOnly: boolean;
  onEdit: (session: ClassSessionDto) => void;
  onRemove: (session: ClassSessionDto) => void;
};

/**
 * One class in the week. Shows the course code rather than the id, so the card reads
 * without a lookup — the names come from the same lists the pickers use.
 */
export function ScheduleGridCell({ session, courses, teachers, labels, isReadOnly, onEdit, onRemove }: ScheduleGridCellProps) {
  const course = courses.find(x => x.courseId === session.courseId);
  const teacherName = teachers.find(x => x.userId === session.teacherId)?.name;

  const handleEditClick = (): void => {
    onEdit(session);
  };

  const handleRemoveClick = (): void => {
    onRemove(session);
  };

  return (
    <article className="border-border bg-card flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-regular-semibold">{course?.code ?? session.courseId}</span>
        {course && <span className="text-muted-foreground line-clamp-2 text-xs">{course.title}</span>}
      </div>

      <dl className="text-muted-foreground flex flex-col gap-1 text-xs">
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          <dd>
            {session.startTime}–{session.endTime}
          </dd>
        </div>

        <div className="flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">{labels.room}</dt>
          <dd>{session.room}</dd>
        </div>

        {teacherName && (
          <div className="flex items-center gap-1.5">
            <User className="size-3.5 shrink-0" aria-hidden />
            <dd className="truncate">{teacherName}</dd>
          </div>
        )}
      </dl>

      {!isReadOnly && (
        <div className="grid grid-cols-2 gap-1.5">
          <Button type="button" variant="outline" size="xs" onClick={handleEditClick}>
            <Pencil className="size-3" />
            {labels.edit}
          </Button>

          <Button type="button" variant="outline" size="xs" onClick={handleRemoveClick}>
            <Trash2 className="size-3" />
            {labels.remove}
          </Button>
        </div>
      )}
    </article>
  );
}
