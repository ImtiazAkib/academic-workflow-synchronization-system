import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { USER_ROLES } from '@/constants/roles.const';

import { requireAdminArea } from '@/lib/auth';
import { UserFiltersSchema } from '@/lib/schemas';
import { UserService } from '@/lib/services';

import { UsersScreen } from '@/components/admin/users';

import { loadUsersSearchParams } from './page-search-params';

import type { SearchParams } from 'nuqs/server';

const userService = new UserService();

type AdminUsersPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ params }: Pick<AdminUsersPageProps, 'params'>): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('USERS_METADATA_TITLE'),
    robots: { index: false, follow: false },
  };
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  // A teacher or student who reaches this URL is sent to /unauthorized, not sign-in.
  const sessionUser = await requireAdminArea();

  /*
    The URL is parsed, then validated. `UserFiltersSchema` catches rather than throws on
    every field, so a hand-edited query string degrades to the unfiltered list instead
    of rendering an error page.
  */
  const filters = UserFiltersSchema.parse(await loadUsersSearchParams(searchParams));

  const l10n = await getTranslations();
  const result = await userService.list(filters);
  const users = result.result;

  /*
    Every key is written as a literal `l10n('KEY')` call. Collecting them into an array
    and mapping is what the translator rulebook forbids — the editor integration only
    finds keys in this form.
  */
  return (
    <UsersScreen
      users={users}
      viewer={{ userId: sessionUser.userId, isSuperAdmin: sessionUser.role === USER_ROLES.SUPER_ADMIN }}
      labels={{
        title: l10n('USERS_TITLE'),
        intro: l10n('USERS_INTRO'),
        createCta: l10n('USERS_CREATE_CTA'),
        search: l10n('USERS_FILTERS_SEARCH_LABEL'),
        searchPlaceholder: l10n('USERS_FILTERS_SEARCH_PLACEHOLDER'),
        roleFilter: l10n('USERS_FILTERS_ROLE_LABEL'),
        statusFilter: l10n('USERS_FILTERS_STATUS_LABEL'),
        all: l10n('USERS_FILTERS_ALL'),
        clearFilters: l10n('USERS_FILTERS_CLEAR'),
        statusPending: l10n('USERS_STATUS_PENDING'),
        statusActive: l10n('USERS_STATUS_ACTIVE'),
        statusInactive: l10n('USERS_STATUS_INACTIVE'),
        roleSuperAdmin: l10n('ROLE_SUPER_ADMIN_LABEL'),
        roleAdmin: l10n('ROLE_ADMIN_LABEL'),
        roleTeacher: l10n('ROLE_TEACHER_LABEL'),
        roleStudent: l10n('ROLE_STUDENT_LABEL'),
        tableLabel: l10n('USERS_TABLE_LABEL'),
        columnName: l10n('USERS_TABLE_NAME'),
        columnEmail: l10n('USERS_TABLE_EMAIL'),
        columnRole: l10n('USERS_TABLE_ROLE'),
        columnDepartmentBatch: l10n('USERS_TABLE_DEPARTMENT_BATCH'),
        columnJoined: l10n('USERS_TABLE_JOINED'),
        columnStatus: l10n('USERS_TABLE_STATUS'),
        columnActions: l10n('USERS_TABLE_ACTIONS'),
        count: l10n('USERS_TABLE_COUNT', { count: users.length }),
        emptyTitle: l10n('USERS_EMPTY_TITLE'),
        emptyDescription: l10n('USERS_EMPTY_DESCRIPTION'),
        edit: l10n('USERS_ACTION_EDIT'),
        approve: l10n('USERS_ACTION_APPROVE'),
        revoke: l10n('USERS_ACTION_REVOKE'),
        deactivate: l10n('USERS_ACTION_DEACTIVATE'),
        reactivate: l10n('USERS_ACTION_REACTIVATE'),
        delete: l10n('USERS_ACTION_DELETE'),
        actionsUnavailable: l10n('USERS_ACTION_UNAVAILABLE'),
        fields: {
          name: l10n('USERS_FIELD_NAME_LABEL'),
          email: l10n('USERS_FIELD_EMAIL_LABEL'),
          password: l10n('USERS_FIELD_PASSWORD_LABEL'),
          role: l10n('USERS_FIELD_ROLE_LABEL'),
          designation: l10n('USERS_FIELD_DESIGNATION_LABEL'),
          roll: l10n('USERS_FIELD_ROLL_LABEL'),
          registrationNo: l10n('USERS_FIELD_REGISTRATION_NO_LABEL'),
          session: l10n('USERS_FIELD_SESSION_LABEL'),
          sessionUnset: l10n('USERS_FIELD_SESSION_UNSET'),
          department: l10n('USERS_FIELD_DEPARTMENT_LABEL'),
          semester: l10n('USERS_FIELD_SEMESTER_LABEL'),
          semesterUnset: l10n('USERS_FIELD_SEMESTER_UNSET'),
          phone: l10n('USERS_FIELD_PHONE_LABEL'),
          optional: l10n('USERS_FIELD_OPTIONAL'),
        },
        fieldErrors: {
          nameRequired: l10n('USERS_FIELD_NAME_REQUIRED'),
          nameTooLong: l10n('USERS_FIELD_NAME_TOO_LONG'),
          emailInvalid: l10n('USERS_FIELD_EMAIL_INVALID'),
          passwordTooShort: l10n('USERS_FIELD_PASSWORD_TOO_SHORT'),
          roleInvalid: l10n('USERS_FIELD_ROLE_INVALID'),
          designationTooLong: l10n('USERS_FIELD_DESIGNATION_TOO_LONG'),
          rollTooLong: l10n('USERS_FIELD_ROLL_TOO_LONG'),
          rollDigitsOnly: l10n('USERS_FIELD_ROLL_DIGITS_ONLY'),
          registrationNoTooLong: l10n('USERS_FIELD_REGISTRATION_NO_TOO_LONG'),
          registrationNoDigitsOnly: l10n('USERS_FIELD_REGISTRATION_NO_DIGITS_ONLY'),
          sessionTooLong: l10n('USERS_FIELD_SESSION_TOO_LONG'),
          departmentTooLong: l10n('USERS_FIELD_DEPARTMENT_TOO_LONG'),
          semesterInvalid: l10n('USERS_FIELD_SEMESTER_INVALID'),
          phoneInvalid: l10n('USERS_FIELD_PHONE_INVALID'),
        },
        createTitle: l10n('USERS_CREATE_TITLE'),
        createDescription: l10n('USERS_CREATE_DESCRIPTION'),
        createSubmit: l10n('USERS_CREATE_SUBMIT'),
        editTitle: l10n('USERS_EDIT_TITLE'),
        editDescription: l10n('USERS_EDIT_DESCRIPTION'),
        editSubmit: l10n('USERS_EDIT_SUBMIT'),
        approveDialog: {
          title: l10n('USERS_APPROVE_TITLE'),
          description: l10n('USERS_APPROVE_DESCRIPTION'),
          confirm: l10n('USERS_ACTION_APPROVE'),
        },
        revokeDialog: {
          title: l10n('USERS_REVOKE_TITLE'),
          description: l10n('USERS_REVOKE_DESCRIPTION'),
          confirm: l10n('USERS_ACTION_REVOKE'),
        },
        deactivateDialog: {
          title: l10n('USERS_DEACTIVATE_TITLE'),
          description: l10n('USERS_DEACTIVATE_DESCRIPTION'),
          confirm: l10n('USERS_ACTION_DEACTIVATE'),
        },
        reactivateDialog: {
          title: l10n('USERS_REACTIVATE_TITLE'),
          description: l10n('USERS_REACTIVATE_DESCRIPTION'),
          confirm: l10n('USERS_ACTION_REACTIVATE'),
        },
        deleteDialog: {
          title: l10n('USERS_DELETE_TITLE'),
          description: l10n('USERS_DELETE_DESCRIPTION'),
          confirm: l10n('USERS_DELETE_CONFIRM'),
        },
        cancel: l10n('USERS_DIALOG_CANCEL'),
        working: l10n('USERS_DIALOG_WORKING'),
        toastCreated: l10n('USERS_TOAST_CREATED'),
        toastUpdated: l10n('USERS_TOAST_UPDATED'),
        toastApproved: l10n('USERS_TOAST_APPROVED'),
        toastRevoked: l10n('USERS_TOAST_REVOKED'),
        toastDeactivated: l10n('USERS_TOAST_DEACTIVATED'),
        toastReactivated: l10n('USERS_TOAST_REACTIVATED'),
        toastDeleted: l10n('USERS_TOAST_DELETED'),
        errors: {
          emailTaken: l10n('USERS_ERROR_EMAIL_TAKEN'),
          adminLimit: l10n('USERS_ERROR_ADMIN_LIMIT'),
          ownAccess: l10n('USERS_ERROR_OWN_ACCESS'),
          superAdmin: l10n('USERS_ERROR_SUPER_ADMIN'),
          adminOnlySuperAdmin: l10n('USERS_ERROR_ADMIN_ONLY_SUPER_ADMIN'),
          roleLocked: l10n('USERS_ERROR_ROLE_LOCKED'),
          superAdminCreatesAdmins: l10n('USERS_ERROR_SUPER_ADMIN_CREATES_ADMINS'),
          notFound: l10n('USERS_ERROR_NOT_FOUND'),
          generic: l10n('USERS_ERROR_GENERIC'),
        },
      }}
    />
  );
}
