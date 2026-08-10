import { CalendarDays, FolderOpen, GraduationCap, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/l10n/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { CourseService, StudentService } from '@/lib/services';
import { resolveDepartmentToday, resolveSemesterLabel } from '@/lib/utils';

import { DashboardNotices } from '@/components/dashboard';
import { StudentEmpty, StudentRoutineCard } from '@/components/student';

const courseService = new CourseService();
const studentService = new StudentService();

/*
  The step's own goal sentence — everything a student needs on one screen. Today's
  classes, then the three screens that hold the rest.

  Today is resolved in `Asia/Dhaka`, never from the runtime clock: a Vercel instance runs
  UTC and would show tomorrow's classes for the last six hours of every Bangladeshi day.
*/
export default async function StudentDashboardPage() {
  const sessionUser = await requireRole(USER_ROLES.STUDENT);

  const l10n = await getTranslations();

  const semester = await studentService.resolveSemester(sessionUser.userId);
  // The intake, for scoping the notice feed to the session notices addressed to this batch.
  const studentSession = await studentService.resolveSession(sessionUser.userId);

  const today = resolveDepartmentToday(new Date());

  const [sessionResult, courseResult, teacherResult] = await Promise.all([
    semester ? studentService.getRoutine(semester) : null,
    courseService.list(),
    studentService.listTeachers(),
  ]);

  const todaysClasses = (sessionResult?.result ?? []).filter(x => x.dayOfWeek === today);
  const courses = courseResult.result.map(x => ({ courseId: x.courseId, code: x.code, title: x.title }));
  const teachers = teacherResult.result.map(x => ({ userId: x.userId, name: x.name }));

  const links = [
    { href: ROUTES.STUDENT_SCHEDULE.HREF, icon: CalendarDays, label: l10n('STUDENT_SCHEDULE_TITLE'), hint: l10n('STUDENT_SCHEDULE_INTRO') },
    { href: ROUTES.STUDENT_MATERIALS.HREF, icon: FolderOpen, label: l10n('STUDENT_MATERIALS_TITLE'), hint: l10n('STUDENT_MATERIALS_INTRO') },
    { href: ROUTES.STUDENT_TEACHERS.HREF, icon: Users, label: l10n('STUDENT_TEACHERS_TITLE'), hint: l10n('STUDENT_TEACHERS_INTRO') },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl">{l10n('DASHBOARD_STUDENT_TITLE')}</h1>
        <p className="text-muted-foreground text-sm">{l10n('DASHBOARD_STUDENT_INTRO')}</p>
        {semester && <p className="text-muted-foreground text-xs">{l10n('STUDENT_SEMESTER_BADGE', { semester: resolveSemesterLabel(semester) })}</p>}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-regular-semibold">{l10n('STUDENT_TODAY_TITLE')}</h2>

        {!semester ? (
          <StudentEmpty icon={GraduationCap} title={l10n('STUDENT_NO_SEMESTER_TITLE')} description={l10n('STUDENT_NO_SEMESTER_DESCRIPTION')} />
        ) : todaysClasses.length === 0 ? (
          <StudentEmpty icon={CalendarDays} title={l10n('STUDENT_TODAY_EMPTY_TITLE')} description={l10n('STUDENT_TODAY_EMPTY_DESCRIPTION')} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todaysClasses.map(x => (
              <StudentRoutineCard
                key={x.classSessionId}
                session={x}
                courses={courses}
                teachers={teachers}
                labels={{
                  statusCancelled: l10n('SCHEDULE_STATUS_CANCELLED'),
                  time: l10n('STUDENT_ROUTINE_TIME_LABEL'),
                  teacher: l10n('SCHEDULE_FIELD_TEACHER_LABEL'),
                }}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-regular-semibold">{l10n('DASHBOARD_NOTICES_TITLE')}</h2>

        {/* Addressed to `all` or `students` — the query cannot return a teachers-only notice. */}
        <DashboardNotices role={USER_ROLES.STUDENT} viewerSession={studentSession} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-regular-semibold">{l10n('STUDENT_LINKS_TITLE')}</h2>

        <div className="grid gap-3 sm:grid-cols-3">
          {links.map(x => (
            <Link
              key={x.href}
              href={x.href}
              className="border-border bg-card hover:border-primary/40 flex flex-col gap-1.5 rounded-lg border p-4 transition-colors">
              <x.icon className="text-muted-foreground size-5" aria-hidden />
              <span className="text-regular-semibold">{x.label}</span>
              <span className="text-muted-foreground line-clamp-2 text-xs">{x.hint}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
