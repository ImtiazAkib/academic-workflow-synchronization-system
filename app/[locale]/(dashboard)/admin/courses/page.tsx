import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { USER_ROLES } from '@/constants/roles.const';
import { SEMESTER } from '@/constants/schedule.const';
import { FILTER_ALL } from '@/constants/users.const';

import { requireRole } from '@/lib/auth';
import { CourseService, UserService } from '@/lib/services';

import { CoursesScreen } from '@/components/admin/courses';

import { loadCoursesSearchParams } from './page-search-params';

import type { SearchParams } from 'nuqs/server';

const courseService = new CourseService();
const userService = new UserService();

type AdminCoursesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ params }: Pick<AdminCoursesPageProps, 'params'>): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('COURSES_METADATA_TITLE'),
    robots: { index: false, follow: false },
  };
}

export default async function AdminCoursesPage({ searchParams }: AdminCoursesPageProps) {
  // A teacher or student who reaches this URL is sent to /unauthorized, not sign-in.
  await requireRole(USER_ROLES.ADMIN);

  const filters = await loadCoursesSearchParams(searchParams);

  /*
    A hand-edited `?semester=wizard` falls back to the unfiltered list rather than
    rendering an error page — the same degrade-on-nonsense rule the users screen uses.
  */
  const parsed = Number(filters.semester);
  const semester =
    filters.semester !== FILTER_ALL && Number.isInteger(parsed) && parsed >= SEMESTER.MIN && parsed <= SEMESTER.MAX ? parsed : undefined;

  const l10n = await getTranslations();

  const [courseResult, teacherResult] = await Promise.all([
    courseService.list(semester),
    // Only approved, active teachers can be handed a course.
    userService.list({ role: USER_ROLES.TEACHER, status: 'active', query: '' }),
  ]);

  const courses = courseResult.result;
  const teachers = teacherResult.result.map(x => ({ userId: x.userId, name: x.name }));

  return (
    <CoursesScreen
      courses={courses}
      teachers={teachers}
      labels={{
        createCta: l10n('COURSES_CREATE_CTA'),
        semesterFilter: l10n('COURSES_FILTERS_SEMESTER_LABEL'),
        all: l10n('COURSES_FILTERS_ALL'),
        clearFilter: l10n('COURSES_FILTERS_CLEAR'),
        tableLabel: l10n('COURSES_TITLE'),
        columnCode: l10n('COURSES_TABLE_CODE'),
        columnTitle: l10n('COURSES_TABLE_TITLE'),
        columnSemester: l10n('COURSES_TABLE_SEMESTER'),
        columnCredits: l10n('COURSES_TABLE_CREDITS'),
        columnTeacher: l10n('COURSES_TABLE_TEACHER'),
        columnStatus: l10n('COURSES_TABLE_STATUS'),
        columnActions: l10n('COURSES_TABLE_ACTIONS'),
        count: l10n('COURSES_TABLE_COUNT', { count: courses.length }),
        statusActive: l10n('COURSES_STATUS_ACTIVE'),
        statusInactive: l10n('COURSES_STATUS_INACTIVE'),
        unassigned: l10n('COURSES_TEACHER_UNASSIGNED'),
        emptyTitle: l10n('COURSES_EMPTY_TITLE'),
        emptyDescription: l10n('COURSES_EMPTY_DESCRIPTION'),
        edit: l10n('COURSES_ACTION_EDIT'),
        deactivate: l10n('COURSES_ACTION_DEACTIVATE'),
        reactivate: l10n('COURSES_ACTION_REACTIVATE'),
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
        editTitle: l10n('COURSES_EDIT_TITLE'),
        editDescription: l10n('COURSES_EDIT_DESCRIPTION'),
        editSubmit: l10n('COURSES_EDIT_SUBMIT'),
        deactivateDialog: {
          title: l10n('COURSES_DEACTIVATE_TITLE'),
          description: l10n('COURSES_DEACTIVATE_DESCRIPTION'),
          confirm: l10n('COURSES_ACTION_DEACTIVATE'),
        },
        reactivateDialog: {
          title: l10n('COURSES_REACTIVATE_TITLE'),
          description: l10n('COURSES_REACTIVATE_DESCRIPTION'),
          confirm: l10n('COURSES_ACTION_REACTIVATE'),
        },
        cancel: l10n('COURSES_DIALOG_CANCEL'),
        working: l10n('COURSES_DIALOG_WORKING'),
        toastUpdated: l10n('COURSES_TOAST_UPDATED'),
        toastDeactivated: l10n('COURSES_TOAST_DEACTIVATED'),
        toastReactivated: l10n('COURSES_TOAST_REACTIVATED'),
        errors: {
          codeTaken: l10n('COURSES_ERROR_CODE_TAKEN'),
          notFound: l10n('COURSES_ERROR_NOT_FOUND'),
          hasSessions: l10n('COURSES_ERROR_HAS_SESSIONS'),
          teacherInvalid: l10n('COURSES_ERROR_TEACHER_INVALID'),
          generic: l10n('COURSES_ERROR_GENERIC'),
        },
      }}
    />
  );
}
