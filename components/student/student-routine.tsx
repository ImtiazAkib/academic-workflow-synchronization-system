import { ClassSessionDto, DayOfWeek } from '@/types';

import { TEACHING_DAYS } from '@/constants/schedule.const';

import { cn, groupSessionsByDay } from '@/lib/utils';

import { StudentRoutineCard } from './student-routine-card';

import type { StudentCourseOption, StudentRoutineLabels, StudentTeacherOption } from './student.types';

type StudentRoutineProps = {
  sessions: ClassSessionDto[];
  courses: StudentCourseOption[];
  teachers: StudentTeacherOption[];
  labels: StudentRoutineLabels;
  today: DayOfWeek;
};

/*
  The same five-column week the administrator and the teacher read, so a student is not
  learning a second layout for the same information — day columns rather than a
  time-of-day grid, for the reason recorded on `ScheduleWeekView`.

  `today` is resolved in `Asia/Dhaka` by the page. Never from the runtime clock: a Vercel
  instance runs UTC and would mark the wrong column every Bangladeshi evening.
*/
export function StudentRoutine({ sessions, courses, teachers, labels, today }: StudentRoutineProps) {
  const grouped = groupSessionsByDay(sessions);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
            grouped[day].map(x => <StudentRoutineCard key={x.classSessionId} session={x} courses={courses} teachers={teachers} labels={labels} />)
          )}
        </section>
      ))}
    </div>
  );
}
