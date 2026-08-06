import { ClassSessionDto, DayOfWeek } from '@/types';

import { TEACHING_DAYS } from '@/constants/schedule.const';

import { cn, groupSessionsByDay } from '@/lib/utils';

import { ScheduleGridCell } from './schedule-grid-cell';

import type { CourseOption, ScheduleLabels, TeacherOption } from './schedule.types';

type ScheduleWeekViewProps = {
  sessions: ClassSessionDto[];
  courses: CourseOption[];
  teachers: TeacherOption[];
  labels: ScheduleLabels;
  today: DayOfWeek;
  isReadOnly: boolean;
  onEdit: (session: ClassSessionDto) => void;
  onRemove: (session: ClassSessionDto) => void;
};

/*
  Five columns from `lg` up, a stack below it. Not a time-of-day grid: a fixed hour
  scale wastes most of its height on empty rows, and on a phone it is unreadable. Each
  day lists its classes in order instead, which is the same information.

  `today` is resolved in `Asia/Dhaka` by the caller — never from the runtime clock,
  which is UTC on Vercel and would mark the wrong column every Bangladeshi evening.
*/
export function ScheduleWeekView({ sessions, courses, teachers, labels, today, isReadOnly, onEdit, onRemove }: ScheduleWeekViewProps) {
  const grouped = groupSessionsByDay(sessions);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {TEACHING_DAYS.map(day => (
        <section
          key={day}
          aria-label={labels.days[day]}
          className={cn('flex flex-col gap-2 rounded-lg p-2', day === today ? 'bg-primary/5 ring-primary/20 ring-1' : 'bg-muted/30')}>
          <header className="flex items-center justify-between gap-2 px-1">
            <h2 className="text-regular-semibold text-sm">{labels.days[day]}</h2>
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
                isReadOnly={isReadOnly}
                onEdit={onEdit}
                onRemove={onRemove}
              />
            ))
          )}
        </section>
      ))}
    </div>
  );
}
