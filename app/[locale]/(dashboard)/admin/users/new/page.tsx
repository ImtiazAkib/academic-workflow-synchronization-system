import type { Metadata } from 'next';

import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/l10n/navigation';

import { USER_ROLES } from '@/constants/roles.const';
import { ROUTES } from '@/constants/routes.const';

import { requireAdminArea } from '@/lib/auth';

import { UserCreateForm } from '@/components/admin/users';

type AdminUserCreatePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: AdminUserCreatePageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('USERS_CREATE_TITLE'),
    robots: { index: false, follow: false },
  };
}

export default async function AdminUserCreatePage() {
  // A teacher or student who reaches this URL is sent to /unauthorized, not sign-in.
  const sessionUser = await requireAdminArea();

  const l10n = await getTranslations();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href={ROUTES.ADMIN_USERS.HREF}
          className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-colors">
          <ArrowLeft className="size-4" />
          {l10n('USERS_BACK_TO_LIST')}
        </Link>

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl">{l10n('USERS_CREATE_TITLE')}</h1>
          <p className="text-muted-foreground text-sm">{l10n('USERS_CREATE_DESCRIPTION')}</p>
        </div>
      </div>

      <div className="surface-card p-4 sm:p-6">
        <UserCreateForm
          viewer={{ userId: sessionUser.userId, isSuperAdmin: sessionUser.role === USER_ROLES.SUPER_ADMIN }}
          labels={{
            fields: {
              name: l10n('USERS_FIELD_NAME_LABEL'),
              email: l10n('USERS_FIELD_EMAIL_LABEL'),
              password: l10n('USERS_FIELD_PASSWORD_LABEL'),
              role: l10n('USERS_FIELD_ROLE_LABEL'),
              designation: l10n('USERS_FIELD_DESIGNATION_LABEL'),
              roll: l10n('USERS_FIELD_ROLL_LABEL'),
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
              semesterInvalid: l10n('USERS_FIELD_SEMESTER_INVALID'),
              phoneTooLong: l10n('USERS_FIELD_PHONE_TOO_LONG'),
            },
            roleSuperAdmin: l10n('ROLE_SUPER_ADMIN_LABEL'),
            roleAdmin: l10n('ROLE_ADMIN_LABEL'),
            roleTeacher: l10n('ROLE_TEACHER_LABEL'),
            roleStudent: l10n('ROLE_STUDENT_LABEL'),
            submit: l10n('USERS_CREATE_SUBMIT'),
            working: l10n('USERS_DIALOG_WORKING'),
            cancel: l10n('USERS_DIALOG_CANCEL'),
            created: l10n('USERS_TOAST_CREATED'),
            errors: {
              emailTaken: l10n('USERS_ERROR_EMAIL_TAKEN'),
              adminLimit: l10n('USERS_ERROR_ADMIN_LIMIT'),
              ownAccess: l10n('USERS_ERROR_OWN_ACCESS'),
              superAdmin: l10n('USERS_ERROR_SUPER_ADMIN'),
              adminOnlySuperAdmin: l10n('USERS_ERROR_ADMIN_ONLY_SUPER_ADMIN'),
              notFound: l10n('USERS_ERROR_NOT_FOUND'),
              generic: l10n('USERS_ERROR_GENERIC'),
            },
          }}
        />
      </div>
    </div>
  );
}
