import type { Metadata } from 'next';

import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/l10n/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireRole } from '@/lib/auth';
import { UserService } from '@/lib/services';

import { CourseCreateForm } from '@/components/admin/courses';

const userService = new UserService();

type AdminCourseCreatePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: AdminCourseCreatePageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('COURSES_CREATE_TITLE'),
    robots: { index: false, follow: false },
  };
}

export default async function AdminCourseCreatePage() {
  await requireRole(USER_ROLES.ADMIN);

  const l10n = await getTranslations();
  const teacherResult = await userService.list({ role: USER_ROLES.TEACHER, status: 'active', query: '' });
  const teachers = teacherResult.result.map(x => ({ userId: x.userId, name: x.name }));

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href={ROUTES.ADMIN_COURSES.HREF}
          className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-colors">
          <ArrowLeft className="size-4" />
          {l10n('COURSES_BACK_TO_LIST')}
        </Link>

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl">{l10n('COURSES_CREATE_TITLE')}</h1>
          <p className="text-muted-foreground text-sm">{l10n('COURSES_CREATE_DESCRIPTION')}</p>
        </div>
      </div>

      <div className="surface-card p-4 sm:p-6">
        <CourseCreateForm
          teachers={teachers}
          labels={{
            fields: {
              code: l10n('COURSES_FIELD_CODE_LABEL'),
              title: l10n('COURSES_FIELD_TITLE_LABEL'),
              semester: l10n('COURSES_FIELD_SEMESTER_LABEL'),
              credits: l10n('COURSES_FIELD_CREDITS_LABEL'),
              teacher: l10n('COURSES_FIELD_TEACHER_LABEL'),
              optional: l10n('COURSES_FIELD_OPTIONAL'),
              unassigned: l10n('COURSES_TEACHER_UNASSIGNED'),
            },
            fieldErrors: {
              codeRequired: l10n('COURSES_FIELD_CODE_REQUIRED'),
              codeTooLong: l10n('COURSES_FIELD_CODE_TOO_LONG'),
              titleRequired: l10n('COURSES_FIELD_TITLE_REQUIRED'),
              titleTooLong: l10n('COURSES_FIELD_TITLE_TOO_LONG'),
              semesterInvalid: l10n('COURSES_FIELD_SEMESTER_INVALID'),
              creditsInvalid: l10n('COURSES_FIELD_CREDITS_INVALID'),
            },
            submit: l10n('COURSES_CREATE_SUBMIT'),
            working: l10n('COURSES_DIALOG_WORKING'),
            cancel: l10n('COURSES_DIALOG_CANCEL'),
            created: l10n('COURSES_TOAST_CREATED'),
            errors: {
              codeTaken: l10n('COURSES_ERROR_CODE_TAKEN'),
              notFound: l10n('COURSES_ERROR_NOT_FOUND'),
              hasSessions: l10n('COURSES_ERROR_HAS_SESSIONS'),
              teacherInvalid: l10n('COURSES_ERROR_TEACHER_INVALID'),
              generic: l10n('COURSES_ERROR_GENERIC'),
            },
          }}
        />
      </div>
    </div>
  );
}
