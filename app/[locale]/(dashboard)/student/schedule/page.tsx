import type { Metadata } from 'next';

import { CalendarX, GraduationCap } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { CourseService, StudentService } from '@/lib/services';
import { buildDayLabels, resolveDepartmentToday, resolveSemesterLabel } from '@/lib/utils';

import { StudentEmpty, StudentRoutine } from '@/components/student';

const courseService = new CourseService();
const studentService = new StudentService();

type StudentSchedulePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: StudentSchedulePageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('STUDENT_SCHEDULE_METADATA_TITLE'),
    robots: { index: false, follow: false },
  };
}

/*
  The routine for the student's own semester, and nothing else on the page can change it.
  The semester comes from their account rather than the URL — there is no search param to
  edit, so "whose routine is this" has exactly one answer.

  Read from the database rather than the session token: the token is only refreshed at
  sign-in, so a semester inside it would keep showing last year's week until the student
  signed out and back in.
*/
export default async function StudentSchedulePage() {
  const sessionUser = await requireRole(USER_ROLES.STUDENT);

  const l10n = await getTranslations();

  const semester = await studentService.resolveSemester(sessionUser.userId);

  if (!semester) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl">{l10n('STUDENT_SCHEDULE_TITLE')}</h1>
          <p className="text-muted-foreground text-sm">{l10n('STUDENT_SCHEDULE_INTRO')}</p>
        </div>

        <StudentEmpty icon={GraduationCap} title={l10n('STUDENT_NO_SEMESTER_TITLE')} description={l10n('STUDENT_NO_SEMESTER_DESCRIPTION')} />
      </div>
    );
  }

  /*
    Courses are fetched unfiltered rather than by semester: a class session carries its
    own semester, and nothing stops an administrator scheduling a course into a year
    other than the one the course is registered under. Narrowing the lookup here would
    leave those cards showing a raw id instead of a code.
  */
  const [sessionResult, courseResult, teacherResult] = await Promise.all([
    studentService.getRoutine(semester),
    courseService.list(),
    studentService.listTeachers(),
  ]);

  const sessions = sessionResult.result;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl">{l10n('STUDENT_SCHEDULE_TITLE')}</h1>
        <p className="text-muted-foreground text-sm">{l10n('STUDENT_SCHEDULE_INTRO')}</p>
        <p className="text-muted-foreground text-xs">
          {l10n('STUDENT_SEMESTER_BADGE', { semester: resolveSemesterLabel(semester) })} · {l10n('SCHEDULE_COUNT', { count: sessions.length })}
        </p>
      </div>

      {sessions.length === 0 ? (
        <StudentEmpty icon={CalendarX} title={l10n('STUDENT_SCHEDULE_EMPTY_TITLE')} description={l10n('STUDENT_SCHEDULE_EMPTY_DESCRIPTION')} />
      ) : (
        <StudentRoutine
          sessions={sessions}
          courses={courseResult.result.map(x => ({ courseId: x.courseId, code: x.code, title: x.title }))}
          teachers={teacherResult.result.map(x => ({ userId: x.userId, name: x.name }))}
          labels={{
            days: buildDayLabels(l10n),
            today: l10n('SCHEDULE_TODAY'),
            dayEmpty: l10n('SCHEDULE_DAY_EMPTY'),
            statusCancelled: l10n('SCHEDULE_STATUS_CANCELLED'),
            time: l10n('STUDENT_ROUTINE_TIME_LABEL'),
            teacher: l10n('SCHEDULE_FIELD_TEACHER_LABEL'),
          }}
          today={resolveDepartmentToday(new Date())}
        />
      )}
    </div>
  );
}
