import { ClassSessionDto, DayOfWeek } from '@/types';

import { TEACHING_DAYS } from '@/constants/schedule.const';

import { cn, findScheduleConflicts, groupSessionsByDay } from '@/lib/utils';

import { ScheduleGridCell } from './schedule-grid-cell';

import type { CourseOption, ScheduleLabels, TeacherOption } from './schedule.types';

type ScheduleWeekViewProps = {
  sessions: ClassSessionDto[];
  courses: CourseOption[];
  teachers: TeacherOption[];
  labels: ScheduleLabels;
  today: DayOfWeek;
  canManage: boolean;
  canDelete: boolean;
  onEdit: (session: ClassSessionDto) => void;
  onToggleCancel: (session: ClassSessionDto) => void;
  onRemove: (session: ClassSessionDto) => void;
};

/*
  Five columns from `lg` up, a stack below it. Not a time-of-day grid: a fixed hour
  scale wastes most of its height on empty rows, and on a phone it is unreadable. Each
  day lists its classes in order instead, which is the same information.

  `today` is resolved in `Asia/Dhaka` by the caller — never from the runtime clock,
  which is UTC on Vercel and would mark the wrong column every Bangladeshi evening.
*/
export function ScheduleWeekView({
  sessions,
  courses,
  teachers,
  labels,
  today,
  canManage,
  canDelete,
  onEdit,
  onToggleCancel,
  onRemove,
}: ScheduleWeekViewProps) {
  const grouped = groupSessionsByDay(sessions);

  // Every class caught in a same-teacher double-booking, so its card can flag the clash in place.
  const conflictIds = new Set(findScheduleConflicts(sessions).flatMap(x => [x.first.classSessionId, x.second.classSessionId]));

  return (
    <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {TEACHING_DAYS.map(day => (
        <section key={day} aria-label={labels.days[day]} className="flex flex-col gap-2">
          <header className={cn('flex items-center justify-between gap-2 border-b pb-2', day === today ? 'border-primary/40' : 'border-border')}>
            <h2 className={cn('text-sm font-semibold', day === today && 'text-primary')}>{labels.days[day]}</h2>
            {day === today && <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-medium">{labels.today}</span>}
          </header>

          {grouped[day].length === 0 ? (
            <p className="text-muted-foreground px-1 py-4 text-center text-xs">{labels.dayEmpty}</p>
          ) : (
            grouped[day].map(x => (
              <ScheduleGridCell
                key={x.classSessionId}
                session={x}
                courses={courses}
                teachers={teachers}
                labels={labels}
                isConflicted={conflictIds.has(x.classSessionId)}
                canManage={canManage}
                canDelete={canDelete}
                onEdit={onEdit}
                onToggleCancel={onToggleCancel}
                onRemove={onRemove}
              />
            ))
          )}
        </section>
      ))}
    </div>
  );
}
