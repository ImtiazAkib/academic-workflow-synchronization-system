import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { ClassSessionService, CourseService, UserService } from '@/lib/services';
import { buildScheduleLabels, resolveDepartmentToday } from '@/lib/utils';

import { ScheduleEmpty, ScheduleWeekView } from '@/components/schedule';

const classSessionService = new ClassSessionService();
const courseService = new CourseService();
const userService = new UserService();

type TeacherSchedulePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: TeacherSchedulePageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('TEACHER_SCHEDULE_METADATA_TITLE'),
    robots: { index: false, follow: false },
  };
}

/*
  Read-only, and scoped by the session rather than by a filter: the teacher id comes
  from the signed-in user, never from the URL, so one teacher cannot read another's week
  by editing a query string.

  Renders `ScheduleWeekView` directly rather than `ScheduleScreen` — with no filters and
  no dialogs, the orchestrator would only add machinery this page never uses.
*/
export default async function TeacherSchedulePage() {
  const sessionUser = await requireRole(USER_ROLES.TEACHER);

  const l10n = await getTranslations();

  const [sessionResult, courseResult, teacherResult] = await Promise.all([
    classSessionService.list({ teacherId: sessionUser.userId }),
    courseService.list(),
    userService.list({ role: USER_ROLES.TEACHER, status: 'active', query: '' }),
  ]);

  const sessions = sessionResult.result;
  const labels = buildScheduleLabels(l10n, l10n('SCHEDULE_COUNT', { count: sessions.length }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl">{l10n('TEACHER_SCHEDULE_TITLE')}</h1>
        <p className="text-muted-foreground text-sm">{l10n('TEACHER_SCHEDULE_INTRO')}</p>
      </div>

      {sessions.length === 0 ? (
        <ScheduleEmpty title={labels.emptyTitle} description={labels.emptyDescription} />
      ) : (
        <ScheduleWeekView
          sessions={sessions}
          courses={courseResult.result.map(x => ({ courseId: x.courseId, code: x.code, title: x.title }))}
          teachers={teacherResult.result.map(x => ({ userId: x.userId, name: x.name }))}
          labels={labels}
          today={resolveDepartmentToday(new Date())}
          isReadOnly
          onEdit={() => undefined}
          onRemove={() => undefined}
        />
      )}
    </div>
  );
}
