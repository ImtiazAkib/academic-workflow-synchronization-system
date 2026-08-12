import { CalendarDays, FolderOpen, GraduationCap, Users } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';

import { Link } from '@/l10n/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { CourseService, StudentService } from '@/lib/services';
import { formatFileSize, resolveClassStatus, resolveDepartmentNow, resolveDepartmentToday, resolveSemesterLabel } from '@/lib/utils';

import { DashboardMaterialRow, DashboardNextClass, DashboardNotices, DashboardTodaySchedule } from '@/components/dashboard';
import { Button, EmptyState, PageHeader } from '@/components/ui';

const courseService = new CourseService();
const studentService = new StudentService();

/*
  The student's home (R4c): "where do I need to be next" is the first answer, then the rest of the
  day, what was just uploaded, and where to go. Elevates the earlier page — the equal-box routine
  grid becomes the chronological `DashboardTodaySchedule` with a next/now hero above it, and recent
  materials join the screen. Today is resolved in Asia/Dhaka, never the UTC runtime clock.
*/
export default async function StudentDashboardPage() {
  const sessionUser = await requireRole(USER_ROLES.STUDENT);

  const l10n = await getTranslations();
  const format = await getFormatter();

  const semester = await studentService.resolveSemester(sessionUser.userId);
  // The intake, for scoping the notice feed to the session notices addressed to this batch.
  const studentSession = await studentService.resolveSession(sessionUser.userId);

  const now = new Date();
  const today = resolveDepartmentToday(now);
  const nowTime = resolveDepartmentNow(now);

  const [sessionResult, courseResult, teacherResult, materialResult] = await Promise.all([
    semester ? studentService.getRoutine(semester) : null,
    courseService.list(),
    studentService.listTeachers(),
    semester ? studentService.listMaterials(semester) : null,
  ]);

  const todaysClasses = (sessionResult?.result ?? []).filter(x => x.dayOfWeek === today);
  const status = resolveClassStatus(todaysClasses, nowTime);
  const recentMaterials = (materialResult?.result ?? []).slice(0, 5);

  const courseMap = new Map(courseResult.result.map(x => [x.courseId, { code: x.code, title: x.title }]));
  const teacherMap = new Map(teacherResult.result.map(x => [x.userId, x.name]));

  const focus = status.current ?? status.next;
  const focusKind = status.current ? 'now' : status.next ? 'next' : null;
  const nextInLabel = status.minutesUntilNext != null ? l10n('DASHBOARD_NEXT_IN', { minutes: status.minutesUntilNext }) : null;

  const currentIds = new Set(status.current ? [status.current.classSessionId] : []);
  const nextId = status.next?.classSessionId ?? null;

  const links = [
    { href: ROUTES.STUDENT_SCHEDULE.HREF, icon: CalendarDays, label: l10n('STUDENT_SCHEDULE_TITLE'), hint: l10n('STUDENT_SCHEDULE_INTRO') },
    { href: ROUTES.STUDENT_MATERIALS.HREF, icon: FolderOpen, label: l10n('STUDENT_MATERIALS_TITLE'), hint: l10n('STUDENT_MATERIALS_INTRO') },
    { href: ROUTES.STUDENT_TEACHERS.HREF, icon: Users, label: l10n('STUDENT_TEACHERS_TITLE'), hint: l10n('STUDENT_TEACHERS_INTRO') },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <PageHeader title={l10n('DASHBOARD_STUDENT_TITLE')} description={l10n('DASHBOARD_STUDENT_INTRO')} />

        {semester && <p className="text-muted-foreground text-xs">{l10n('STUDENT_SEMESTER_BADGE', { semester: resolveSemesterLabel(semester) })}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {!semester ? (
            <EmptyState icon={GraduationCap} title={l10n('STUDENT_NO_SEMESTER_TITLE')} description={l10n('STUDENT_NO_SEMESTER_DESCRIPTION')} />
          ) : (
            <>
              <section className="flex flex-col gap-3">
                <h2 className="text-section-title">{l10n('STUDENT_NEXT_TITLE')}</h2>

                <DashboardNextClass
                  session={focus}
                  kind={focusKind}
                  course={focus ? courseMap.get(focus.courseId) : undefined}
                  teacherName={focus ? teacherMap.get(focus.teacherId) : undefined}
                  labels={{
                    now: l10n('DASHBOARD_CLASS_NOW'),
                    nextIn: nextInLabel,
                    emptyTitle: l10n('STUDENT_DONE_TITLE'),
                    emptyDescription: l10n('STUDENT_DONE_DESCRIPTION'),
                  }}
                />
              </section>

              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-section-title">{l10n('STUDENT_TODAY_TITLE')}</h2>

                  <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={ROUTES.STUDENT_SCHEDULE.HREF} />}>
                    {l10n('DASHBOARD_VIEW_SCHEDULE')}
                  </Button>
                </div>

                <DashboardTodaySchedule
                  sessions={todaysClasses}
                  courses={courseMap}
                  teachers={teacherMap}
                  currentIds={currentIds}
                  nextId={nextId}
                  nextInLabel={nextInLabel}
                  labels={{
                    now: l10n('DASHBOARD_CLASS_NOW'),
                    cancelled: l10n('SCHEDULE_STATUS_CANCELLED'),
                    emptyTitle: l10n('STUDENT_TODAY_EMPTY_TITLE'),
                    emptyDescription: l10n('STUDENT_TODAY_EMPTY_DESCRIPTION'),
                  }}
                />
              </section>

              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-section-title">{l10n('DASHBOARD_RECENT_MATERIALS_TITLE')}</h2>

                  <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={ROUTES.STUDENT_MATERIALS.HREF} />}>
                    {l10n('DASHBOARD_VIEW_ALL')}
                  </Button>
                </div>

                {recentMaterials.length === 0 ? (
                  <EmptyState
                    icon={FolderOpen}
                    title={l10n('STUDENT_RECENT_MATERIALS_EMPTY_TITLE')}
                    description={l10n('STUDENT_RECENT_MATERIALS_EMPTY_DESCRIPTION')}
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    {recentMaterials.map(material => (
                      <DashboardMaterialRow
                        key={material.materialId}
                        title={material.title}
                        courseCode={courseMap.get(material.courseId)?.code}
                        sizeLabel={formatFileSize(material.size)}
                        agoLabel={format.relativeTime(new Date(material.createdAt), now)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 className="text-section-title">{l10n('DASHBOARD_NOTICES_TITLE')}</h2>

            {/* Addressed to `all` or `students` — the query cannot return a teachers-only notice. */}
            <DashboardNotices role={USER_ROLES.STUDENT} viewerSession={studentSession} />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-section-title">{l10n('STUDENT_LINKS_TITLE')}</h2>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="border-border bg-card hover:border-primary/40 flex flex-col gap-1.5 rounded-lg border p-4 transition-colors">
                  <link.icon className="text-muted-foreground size-5" aria-hidden />
                  <span className="text-card-title">{link.label}</span>
                  <span className="text-muted-foreground line-clamp-2 text-xs">{link.hint}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
