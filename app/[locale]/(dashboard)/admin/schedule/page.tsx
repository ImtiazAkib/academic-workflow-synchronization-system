import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { USER_ROLES } from '@/constants/roles.const';
import { SEMESTER } from '@/constants/schedule.const';
import { FILTER_ALL } from '@/constants/users.const';

import { requireRole } from '@/lib/auth';
import { ClassSessionService, CourseService, UserService } from '@/lib/services';
import { buildScheduleLabels, resolveDepartmentToday } from '@/lib/utils';

import { ScheduleScreen } from '@/components/schedule';

import { loadScheduleSearchParams } from './page-search-params';

import type { SearchParams } from 'nuqs/server';

const classSessionService = new ClassSessionService();
const courseService = new CourseService();
const userService = new UserService();

type AdminSchedulePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ params }: Pick<AdminSchedulePageProps, 'params'>): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('SCHEDULE_METADATA_TITLE'),
    robots: { index: false, follow: false },
  };
}

export default async function AdminSchedulePage({ searchParams }: AdminSchedulePageProps) {
  // A teacher or student who reaches this URL is sent to /unauthorized, not sign-in.
  await requireRole(USER_ROLES.ADMIN);

  const filters = await loadScheduleSearchParams(searchParams);

  // A hand-edited `?semester=wizard` degrades to the unfiltered week, never an error page.
  const parsed = Number(filters.semester);
  const semester =
    filters.semester !== FILTER_ALL && Number.isInteger(parsed) && parsed >= SEMESTER.MIN && parsed <= SEMESTER.MAX ? parsed : undefined;
  const teacherId = filters.teacher !== FILTER_ALL ? filters.teacher : undefined;

  const l10n = await getTranslations();

  const [sessionResult, courseResult, teacherResult] = await Promise.all([
    classSessionService.list({ semester, teacherId }),
    courseService.list(),
    userService.list({ role: USER_ROLES.TEACHER, status: 'active', query: '' }),
  ]);

  const sessions = sessionResult.result;

  return (
    <ScheduleScreen
      sessions={sessions}
      courses={courseResult.result.map(x => ({ courseId: x.courseId, code: x.code, title: x.title }))}
      teachers={teacherResult.result.map(x => ({ userId: x.userId, name: x.name }))}
      labels={buildScheduleLabels(l10n, l10n('SCHEDULE_COUNT', { count: sessions.length }))}
      /*
        Resolved here, on the server, in the department's timezone — not in the browser
        and not from the runtime clock, which is UTC on Vercel.
      */
      today={resolveDepartmentToday(new Date())}
    />
  );
}
