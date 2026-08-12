import { Clock, User } from 'lucide-react';

import { ClassSessionDto } from '@/types';

import { cn } from '@/lib/utils';

import type { StudentCourseOption, StudentRoutineCardLabels, StudentTeacherOption } from './student.types';

type StudentRoutineCardProps = {
  session: ClassSessionDto;
  courses: StudentCourseOption[];
  teachers: StudentTeacherOption[];
  labels: StudentRoutineCardLabels;
};

/*
  The read-only twin of `ScheduleGridCell`, and a separate component rather than that one
  with its buttons switched off. `ScheduleGridCell` takes three callbacks and two
  permission flags; rendering it here would mean handing a server component three
  functions that exist only to never be called.

  The semester is absent on purpose - every card on this screen is in the student's own
  semester, so printing it on all of them says nothing.
*/
export function StudentRoutineCard({ session, courses, teachers, labels }: StudentRoutineCardProps) {
  const course = courses.find(x => x.courseId === session.courseId);
  const teacherName = teachers.find(x => x.userId === session.teacherId)?.name;

  return (
    <article className="border-border bg-card flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-2">
          {/* Struck through, not hidden: a class called off still occupies its slot. */}
          <span className={cn('text-regular-semibold', session.isCancelled && 'text-muted-foreground line-through')}>
            {course?.code ?? session.courseId}
          </span>
          {session.isCancelled && (
            <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-xs font-medium">{labels.statusCancelled}</span>
          )}
        </span>
        {course && <span className="text-muted-foreground line-clamp-2 text-xs">{course.title}</span>}
      </div>

      <dl className="text-muted-foreground flex flex-col gap-1 text-xs">
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">{labels.time}</dt>
          <dd>
            {session.startTime}–{session.endTime}
          </dd>
        </div>

        {teacherName && (
          <div className="flex items-center gap-1.5">
            <User className="size-3.5 shrink-0" aria-hidden />
            <dt className="sr-only">{labels.teacher}</dt>
            <dd className="truncate">{teacherName}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}
