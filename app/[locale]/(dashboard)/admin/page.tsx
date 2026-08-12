import { BookOpen, CalendarCheck, CalendarDays, CalendarPlus, Megaphone, TriangleAlert, UserPlus, UserRoundCheck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { USER_ROLES } from '@/constants';
import { Link } from '@/l10n/navigation';

import { ROUTES } from '@/constants/routes.const';

import { requireAdminArea } from '@/lib/auth';
import { ClassSessionService, CourseService, UserService } from '@/lib/services';
import { buildDayLabels, findScheduleConflicts, resolveDepartmentNow, resolveDepartmentToday, resolveRoleLabel } from '@/lib/utils';

import { DashboardNotices, DashboardStat, DashboardTodaySchedule } from '@/components/dashboard';
import { Button, EmptyState, PageHeader } from '@/components/ui';

const classSessionService = new ClassSessionService();
const courseService = new CourseService();
const userService = new UserService();

/*
  The administrator's home (R4a): what needs attention across the department today. An overview
  row (today's classes, open conflicts, the approval backlog, active courses), then an asymmetric
  split — today's department schedule and the conflict scan take the wide column, the approval
  queue and the notice feed the narrow one. All read-only over existing services; the conflict
  list is composed in-page from `findScheduleConflicts`, and the quick actions link to the pages
  that already do the writing.
*/
export default async function AdminDashboardPage() {
  const sessionUser = await requireAdminArea();

  const l10n = await getTranslations();

  const now = new Date();
  const today = resolveDepartmentToday(now);
  const nowTime = resolveDepartmentNow(now);

  const [sessionsResult, coursesResult, teachersResult, pendingResult] = await Promise.all([
    classSessionService.list({}),
    courseService.list(),
    userService.list({ role: USER_ROLES.TEACHER, status: 'all', query: '' }),
    userService.list({ role: 'all', status: 'pending', query: '' }),
  ]);

  const allSessions = sessionsResult.result;
  const todaysSessions = allSessions.filter(x => x.dayOfWeek === today);
  const conflicts = findScheduleConflicts(allSessions);
  const pending = pendingResult.result;

  const courseMap = new Map(coursesResult.result.map(x => [x.courseId, { code: x.code, title: x.title }]));
  const teacherMap = new Map(teachersResult.result.map(x => [x.userId, x.name]));
  const dayLabels = buildDayLabels(l10n);

  // Department-wide "on now": every class currently in session, not one — string compare is chronological.
  const runningNowIds = new Set(
    todaysSessions.filter(x => !x.isCancelled && x.startTime <= nowTime && nowTime < x.endTime).map(x => x.classSessionId)
  );

  const todaysCount = todaysSessions.filter(x => !x.isCancelled).length;
  const activeCourses = coursesResult.result.filter(x => x.isActive).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={l10n('DASHBOARD_ADMIN_TITLE')}
        description={l10n('DASHBOARD_ADMIN_INTRO')}
        actions={
          <>
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={ROUTES.ADMIN_NOTICES_NEW.HREF} />}>
              <Megaphone className="size-4" />
              {l10n('DASHBOARD_QUICK_PUBLISH_NOTICE')}
            </Button>

            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={ROUTES.ADMIN_USERS_NEW.HREF} />}>
              <UserPlus className="size-4" />
              {l10n('DASHBOARD_QUICK_CREATE_USER')}
            </Button>

            <Button variant="default" size="sm" nativeButton={false} render={<Link href={ROUTES.ADMIN_SCHEDULE_NEW.HREF} />}>
              <CalendarPlus className="size-4" />
              {l10n('DASHBOARD_QUICK_ADD_CLASS')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashboardStat label={l10n('DASHBOARD_STAT_TODAY_CLASSES')} value={todaysCount} icon={CalendarDays} />
        <DashboardStat
          label={l10n('DASHBOARD_STAT_CONFLICTS')}
          value={conflicts.length}
          icon={TriangleAlert}
          tone={conflicts.length > 0 ? 'danger' : 'default'}
        />
        <DashboardStat
          label={l10n('DASHBOARD_STAT_PENDING')}
          value={pending.length}
          icon={UserRoundCheck}
          tone={pending.length > 0 ? 'warning' : 'default'}
          href={pending.length > 0 ? ROUTES.ADMIN_USERS.HREF : undefined}
        />
        <DashboardStat label={l10n('DASHBOARD_STAT_ACTIVE_COURSES')} value={activeCourses} icon={BookOpen} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-section-title">{l10n('DASHBOARD_TODAY_SCHEDULE_TITLE')}</h2>

              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={ROUTES.ADMIN_SCHEDULE.HREF} />}>
                {l10n('DASHBOARD_VIEW_SCHEDULE')}
              </Button>
            </div>

            <DashboardTodaySchedule
              sessions={todaysSessions}
              courses={courseMap}
              teachers={teacherMap}
              currentIds={runningNowIds}
              labels={{
                now: l10n('DASHBOARD_CLASS_NOW'),
                cancelled: l10n('SCHEDULE_STATUS_CANCELLED'),
                emptyTitle: l10n('DASHBOARD_TODAY_EMPTY_TITLE'),
                emptyDescription: l10n('DASHBOARD_TODAY_EMPTY_ADMIN'),
              }}
            />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-section-title">{l10n('DASHBOARD_CONFLICTS_TITLE')}</h2>

            {conflicts.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title={l10n('DASHBOARD_CONFLICTS_EMPTY_TITLE')}
                description={l10n('DASHBOARD_CONFLICTS_EMPTY_DESCRIPTION')}
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {conflicts.slice(0, 6).map(conflict => (
                  <li
                    key={`${conflict.first.classSessionId}-${conflict.second.classSessionId}`}
                    className="border-destructive/30 bg-destructive/5 flex flex-col gap-1 rounded-lg border p-3">
                    <span className="text-destructive flex items-center gap-2 text-sm font-medium">
                      <TriangleAlert className="size-4 shrink-0" aria-hidden />
                      {teacherMap.get(conflict.teacherId) ?? conflict.teacherId}
                      <span className="text-muted-foreground font-normal">· {dayLabels[conflict.day]}</span>
                    </span>

                    <span className="text-muted-foreground text-xs tabular-nums">
                      {courseMap.get(conflict.first.courseId)?.code ?? conflict.first.courseId} ({conflict.first.startTime}–{conflict.first.endTime})
                      · {courseMap.get(conflict.second.courseId)?.code ?? conflict.second.courseId} ({conflict.second.startTime}–
                      {conflict.second.endTime})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-section-title">{l10n('DASHBOARD_PENDING_TITLE')}</h2>

              {pending.length > 0 && (
                <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={ROUTES.ADMIN_USERS.HREF} />}>
                  {l10n('DASHBOARD_VIEW_ALL')}
                </Button>
              )}
            </div>

            {pending.length === 0 ? (
              <EmptyState
                icon={UserRoundCheck}
                title={l10n('DASHBOARD_PENDING_EMPTY_TITLE')}
                description={l10n('DASHBOARD_PENDING_EMPTY_DESCRIPTION')}
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {pending.slice(0, 6).map(account => (
                  <li key={account.userId} className="border-border bg-card flex min-w-0 flex-col rounded-lg border p-3">
                    <span className="truncate text-sm font-medium">{account.name}</span>
                    <span className="text-muted-foreground text-xs">{resolveRoleLabel(account.role, l10n)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-section-title">{l10n('DASHBOARD_NOTICES_TITLE')}</h2>

            {/* An administrator sees every audience here — they are the ones publishing. */}
            <DashboardNotices role={sessionUser.role} />
          </section>
        </div>
      </div>
    </div>
  );
}
