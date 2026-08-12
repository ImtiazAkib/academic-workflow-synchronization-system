import { BookOpen, FolderOpen } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';

import { USER_ROLES } from '@/constants';
import { Link } from '@/l10n/navigation';

import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { ClassSessionService, CourseService, MaterialService } from '@/lib/services';
import { formatFileSize, resolveClassStatus, resolveDepartmentNow, resolveDepartmentToday, resolveSemesterLabel } from '@/lib/utils';

import { DashboardMaterialRow, DashboardNextClass, DashboardNotices, DashboardTodaySchedule } from '@/components/dashboard';
import { Button, EmptyState, PageHeader } from '@/components/ui';

const classSessionService = new ClassSessionService();
const courseService = new CourseService();
const materialService = new MaterialService();

/*
  The teacher's home (R4b): "what am I teaching next" is the top answer, then the rest of the
  teaching day and the courses and files behind it. `resolveClassStatus` over the teacher's own
  sessions drives the hero (on now / up next) and marks today's list; courses and materials are
  scoped from the session, never a query parameter, exactly as the teacher's own screens do.
*/
export default async function TeacherDashboardPage() {
  const sessionUser = await requireRole(USER_ROLES.TEACHER);

  const l10n = await getTranslations();
  const format = await getFormatter();

  const now = new Date();
  const today = resolveDepartmentToday(now);
  const nowTime = resolveDepartmentNow(now);

  const [sessionsResult, coursesResult, materialsResult] = await Promise.all([
    classSessionService.list({ teacherId: sessionUser.userId }),
    courseService.list(),
    materialService.list(),
  ]);

  const todaysSessions = sessionsResult.result.filter(x => x.dayOfWeek === today);
  const status = resolveClassStatus(todaysSessions, nowTime);

  const courseMap = new Map(coursesResult.result.map(x => [x.courseId, { code: x.code, title: x.title }]));
  const myCourses = coursesResult.result.filter(x => x.assignedTeacherId === sessionUser.userId);
  const myMaterials = materialsResult.result.filter(x => x.uploadedById === sessionUser.userId).slice(0, 5);

  const focus = status.current ?? status.next;
  const focusKind = status.current ? 'now' : status.next ? 'next' : null;
  const nextInLabel = status.minutesUntilNext != null ? l10n('DASHBOARD_NEXT_IN', { minutes: status.minutesUntilNext }) : null;

  const currentIds = new Set(status.current ? [status.current.classSessionId] : []);
  const nextId = status.next?.classSessionId ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={l10n('DASHBOARD_TEACHER_TITLE')} description={l10n('DASHBOARD_TEACHER_INTRO')} />

      <section className="flex flex-col gap-3">
        <h2 className="text-section-title">{l10n('DASHBOARD_TEACHING_NEXT')}</h2>

        <DashboardNextClass
          session={focus}
          kind={focusKind}
          course={focus ? courseMap.get(focus.courseId) : undefined}
          labels={{
            now: l10n('DASHBOARD_CLASS_NOW'),
            nextIn: nextInLabel,
            emptyTitle: l10n('DASHBOARD_TEACHER_DONE_TITLE'),
            emptyDescription: l10n('DASHBOARD_TEACHER_DONE_DESCRIPTION'),
          }}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-section-title">{l10n('DASHBOARD_TODAY_SCHEDULE_TITLE')}</h2>

              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={ROUTES.TEACHER_SCHEDULE.HREF} />}>
                {l10n('DASHBOARD_VIEW_SCHEDULE')}
              </Button>
            </div>

            <DashboardTodaySchedule
              sessions={todaysSessions}
              courses={courseMap}
              currentIds={currentIds}
              nextId={nextId}
              nextInLabel={nextInLabel}
              labels={{
                now: l10n('DASHBOARD_CLASS_NOW'),
                cancelled: l10n('SCHEDULE_STATUS_CANCELLED'),
                emptyTitle: l10n('DASHBOARD_TODAY_EMPTY_TITLE'),
                emptyDescription: l10n('DASHBOARD_TODAY_EMPTY_TEACHER'),
              }}
            />
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-section-title">{l10n('DASHBOARD_RECENT_MATERIALS_TITLE')}</h2>

              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={ROUTES.TEACHER_MATERIALS.HREF} />}>
                {l10n('DASHBOARD_VIEW_ALL')}
              </Button>
            </div>

            {myMaterials.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title={l10n('DASHBOARD_TEACHER_MATERIALS_EMPTY_TITLE')}
                description={l10n('DASHBOARD_TEACHER_MATERIALS_EMPTY_DESCRIPTION')}
              />
            ) : (
              <div className="flex flex-col gap-2">
                {myMaterials.map(material => (
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
        </div>

        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-section-title">{l10n('DASHBOARD_TEACHER_COURSES_TITLE')}</h2>

              {myCourses.length > 0 && (
                <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={ROUTES.TEACHER_COURSES.HREF} />}>
                  {l10n('DASHBOARD_VIEW_ALL')}
                </Button>
              )}
            </div>

            {myCourses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title={l10n('DASHBOARD_TEACHER_COURSES_EMPTY_TITLE')}
                description={l10n('DASHBOARD_TEACHER_COURSES_EMPTY_DESCRIPTION')}
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {myCourses.slice(0, 6).map(course => (
                  <li key={course.courseId} className="border-border bg-card flex min-w-0 flex-col rounded-lg border p-3">
                    <span className="text-sm font-medium">{course.code}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {course.title} · {resolveSemesterLabel(course.semester)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-section-title">{l10n('DASHBOARD_NOTICES_TITLE')}</h2>

            <DashboardNotices role={USER_ROLES.TEACHER} />
          </section>
        </div>
      </div>
    </div>
  );
}
