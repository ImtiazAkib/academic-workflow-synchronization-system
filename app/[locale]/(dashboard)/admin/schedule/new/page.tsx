import type { Metadata } from 'next';

import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/l10n/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { CourseService, UserService } from '@/lib/services';
import { buildDayLabels } from '@/lib/utils';

import { SessionCreateForm } from '@/components/schedule';

const courseService = new CourseService();
const userService = new UserService();

type AdminSessionCreatePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: AdminSessionCreatePageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('SCHEDULE_CREATE_TITLE'),
    robots: { index: false, follow: false },
  };
}

export default async function AdminSessionCreatePage() {
  await requireRole(USER_ROLES.ADMIN);

  const l10n = await getTranslations();

  const [courseResult, teacherResult] = await Promise.all([
    courseService.list(),
    userService.list({ role: USER_ROLES.TEACHER, status: 'active', query: '' }),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href={ROUTES.ADMIN_SCHEDULE.HREF}
          className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-colors">
          <ArrowLeft className="size-4" />
          {l10n('SCHEDULE_BACK_TO_LIST')}
        </Link>

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl">{l10n('SCHEDULE_CREATE_TITLE')}</h1>
          <p className="text-muted-foreground text-sm">{l10n('SCHEDULE_CREATE_DESCRIPTION')}</p>
        </div>
      </div>

      <div className="surface-card p-4 sm:p-6">
        <SessionCreateForm
          courses={courseResult.result.map(x => ({ courseId: x.courseId, code: x.code, title: x.title }))}
          teachers={teacherResult.result.map(x => ({ userId: x.userId, name: x.name }))}
          labels={{
            fields: {
              course: l10n('SCHEDULE_FIELD_COURSE_LABEL'),
              teacher: l10n('SCHEDULE_FIELD_TEACHER_LABEL'),
              day: l10n('SCHEDULE_FIELD_DAY_LABEL'),
              startTime: l10n('SCHEDULE_FIELD_START_LABEL'),
              endTime: l10n('SCHEDULE_FIELD_END_LABEL'),
              semester: l10n('SCHEDULE_FIELD_SEMESTER_LABEL'),
            },
            fieldErrors: {
              courseRequired: l10n('SCHEDULE_FIELD_COURSE_REQUIRED'),
              teacherRequired: l10n('SCHEDULE_FIELD_TEACHER_REQUIRED'),
              timeInvalid: l10n('SCHEDULE_FIELD_TIME_INVALID'),
              endBeforeStart: l10n('SCHEDULE_FIELD_END_BEFORE_START'),
            },
            days: buildDayLabels(l10n),
            conflictTitle: l10n('SCHEDULE_CONFLICT_TITLE'),
            submit: l10n('SCHEDULE_CREATE_SUBMIT'),
            working: l10n('SCHEDULE_DIALOG_WORKING'),
            cancel: l10n('SCHEDULE_DIALOG_CANCEL'),
            saved: l10n('SCHEDULE_TOAST_CREATED'),
            errors: {
              teacherBusy: l10n('SCHEDULE_ERROR_TEACHER_BUSY'),
              notOwnClass: l10n('SCHEDULE_ERROR_NOT_OWN_CLASS'),
              courseScheduled: l10n('SCHEDULE_ERROR_COURSE_SCHEDULED'),
              notFound: l10n('SCHEDULE_ERROR_NOT_FOUND'),
              courseMissing: l10n('SCHEDULE_ERROR_COURSE_MISSING'),
              teacherMissing: l10n('SCHEDULE_ERROR_TEACHER_MISSING'),
              generic: l10n('SCHEDULE_ERROR_GENERIC'),
            },
          }}
        />
      </div>
    </div>
  );
}
