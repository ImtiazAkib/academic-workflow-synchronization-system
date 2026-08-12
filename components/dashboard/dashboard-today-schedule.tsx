import { CalendarClock } from 'lucide-react';

import { EmptyState } from '@/components/ui';

import { DashboardClassRow } from './dashboard-class-row';

import type { ClassSessionDto } from '@/types';

type DashboardTodayScheduleProps = {
  /** Today's sessions for the viewer (department-wide for admin, own for teacher/student). */
  sessions: ClassSessionDto[];
  courses: Map<string, { code: string; title: string }>;
  /** Teacher names by id; omitted on a teacher's own list, where every class is theirs. */
  teachers?: Map<string, string>;
  /**
   * Sessions to mark as happening "Now" and tint. A personal view (teacher/student) passes the one
   * current class; the admin department view passes every class running right now.
   */
  currentIds: Set<string>;
  /** The single next class to mark "in X min" - a personal-view concept, left null department-wide. */
  nextId?: string | null;
  /** Pre-formatted "in 25 min", resolved by the caller (which holds the translator). */
  nextInLabel?: string | null;
  labels: { now: string; cancelled: string; emptyTitle: string; emptyDescription: string };
};

/*
  A dashboard's "today" list (R4): today's classes in order, the ones on now tinted and marked,
  the one up next (personal views only) carrying its "in X min". The parent decides the markers -
  one current class for a person, every running class for the department - so this stays a dumb
  renderer. Empty is a real answer here (a day with no classes) and gets a contextual empty state.
*/
export function DashboardTodaySchedule({ sessions, courses, teachers, currentIds, nextId, nextInLabel, labels }: DashboardTodayScheduleProps) {
  if (sessions.length === 0) {
    return <EmptyState icon={CalendarClock} title={labels.emptyTitle} description={labels.emptyDescription} />;
  }

  const ordered = [...sessions].sort((first, second) => first.startTime.localeCompare(second.startTime));

  return (
    <div className="flex flex-col gap-2">
      {ordered.map(session => {
        const course = courses.get(session.courseId);
        const highlight = currentIds.has(session.classSessionId) ? 'current' : session.classSessionId === nextId ? 'next' : null;

        return (
          <DashboardClassRow
            key={session.classSessionId}
            session={session}
            courseCode={course?.code ?? session.courseId}
            courseTitle={course?.title}
            teacherName={teachers?.get(session.teacherId)}
            highlight={highlight}
            statusLabel={highlight === 'current' ? labels.now : highlight === 'next' ? nextInLabel : null}
            labels={{ cancelled: labels.cancelled }}
          />
        );
      })}
    </div>
  );
}
