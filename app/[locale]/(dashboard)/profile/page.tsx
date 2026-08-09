import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { USER_ROLES } from '@/constants/roles.const';

import { requireSession } from '@/lib/auth';
import { CourseService, UserService } from '@/lib/services';
import { resolveRoleLabel, resolveSemesterLabel, resolveUserStatus, resolveUserStatusLabel } from '@/lib/utils';

import { ProfileEditForm, ProfileSummary } from '@/components/profile';
import type { ProfileCourse, ProfileFact } from '@/components/profile';

type ProfilePageProps = {
  params: Promise<{ locale: string }>;
};

const userService = new UserService();
const courseService = new CourseService();

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('PROFILE_METADATA_TITLE'),
    robots: { index: false, follow: false },
  };
}

/*
  One route for all three roles rather than one per role, which is the decision this
  screen is built around. A student's profile and a teacher's differ by which read-only
  facts they carry and by nothing else — the form is identical — so two screens would be
  two copies of the same form, drifting apart at the speed of whichever one gets edited.

  `/profile` sits outside `/admin`, `/teacher` and `/student`, so it is named explicitly
  in `PROTECTED_SEGMENTS`. Every other signed-in route is covered by one of those three
  prefixes whether anybody remembered it or not; this one is not, and forgetting it would
  leave the screen open to anybody with the URL.

  Read here and not in the session: the cookie carries a name, a role and an approval flag
  because that is all a guard needs, and a profile has to show the record as it stands
  rather than as it stood when somebody signed in.
*/
export default async function ProfilePage() {
  const sessionUser = await requireSession();

  const l10n = await getTranslations();

  const result = await userService.getById(sessionUser.userId);
  const user = result.result;

  /*
    A session naming a row that is no longer there. Rare — accounts are deactivated rather
    than deleted — but the alternative to handling it is a page that throws on a nullable
    read, and "your account could not be loaded" is a better answer than an error screen.
  */
  if (!user) {
    return (
      <div className="flex max-w-3xl flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl">{l10n('PROFILE_TITLE')}</h1>
        <p className="text-muted-foreground text-sm">{l10n('PROFILE_MISSING')}</p>
      </div>
    );
  }

  const isTeacher = user.role === USER_ROLES.TEACHER;

  /*
    Only a teacher has courses assigned to them, so only a teacher pays for the query.
    Fetched by filtering the department's list rather than by a query of its own: it is one
    small collection, and `CourseService` has no by-teacher method to add one for.
  */
  const courses: ProfileCourse[] | null = isTeacher
    ? (await courseService.list()).result
        .filter(x => x.assignedTeacherId === user.userId)
        .map(x => ({ courseId: x.courseId, code: x.code, semester: x.semester }))
    : null;

  const notSet = l10n('PROFILE_VALUE_NOT_SET');

  /*
    Built as a list rather than rendered as a fixed set of rows, so a role that has no
    session or no roll simply contributes no entry — instead of the summary carrying a
    conditional per field and an empty gap wherever one is false.
  */
  const facts: ProfileFact[] = [
    { label: l10n('USERS_FIELD_ROLE_LABEL'), value: resolveRoleLabel(user.role, l10n) },
    {
      label: l10n('USERS_TABLE_STATUS'),
      value: resolveUserStatusLabel(resolveUserStatus(user), {
        pending: l10n('USERS_STATUS_PENDING'),
        active: l10n('USERS_STATUS_ACTIVE'),
        inactive: l10n('USERS_STATUS_INACTIVE'),
      }),
    },
    ...(user.department ? [{ label: l10n('USERS_FIELD_DEPARTMENT_LABEL'), value: user.department }] : []),
    ...(user.designation ? [{ label: l10n('USERS_FIELD_DESIGNATION_LABEL'), value: user.designation }] : []),
    ...(user.roll ? [{ label: l10n('USERS_FIELD_ROLL_LABEL'), value: user.roll }] : []),
    ...(user.registrationNo ? [{ label: l10n('USERS_FIELD_REGISTRATION_NO_LABEL'), value: user.registrationNo }] : []),
    ...(user.session ? [{ label: l10n('USERS_FIELD_SESSION_LABEL'), value: user.session }] : []),
    ...(user.semester ? [{ label: l10n('USERS_FIELD_SEMESTER_LABEL'), value: resolveSemesterLabel(user.semester) }] : []),
    { label: l10n('USERS_FIELD_PHONE_LABEL'), value: user.phone ?? notSet },
    { label: l10n('USERS_FIELD_ADDRESS_LABEL'), value: user.address ?? notSet },
  ];

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl">{l10n('PROFILE_TITLE')}</h1>
        <p className="text-muted-foreground text-sm">{l10n('PROFILE_INTRO')}</p>
      </div>

      <ProfileSummary
        loginId={user.loginId ?? null}
        facts={facts}
        courses={courses}
        labels={{
          loginId: {
            title: l10n('PROFILE_LOGIN_ID_TITLE'),
            description: l10n('PROFILE_LOGIN_ID_DESCRIPTION'),
            empty: l10n('PROFILE_LOGIN_ID_EMPTY'),
            copy: l10n('PROFILE_LOGIN_ID_COPY'),
            copied: l10n('PROFILE_LOGIN_ID_COPIED'),
          },
          recordTitle: l10n('PROFILE_RECORD_TITLE'),
          recordHint: l10n('PROFILE_RECORD_HINT'),
          coursesTitle: l10n('PROFILE_COURSES_TITLE'),
          coursesEmpty: l10n('PROFILE_COURSES_EMPTY'),
        }}
      />

      <section className="border-border bg-card flex flex-col gap-4 rounded-lg border p-4 sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg">{l10n('PROFILE_EDIT_TITLE')}</h2>
          <p className="text-muted-foreground text-sm">{l10n('PROFILE_EDIT_HINT')}</p>
        </div>

        <ProfileEditForm
          user={user}
          labels={{
            fields: {
              name: l10n('USERS_FIELD_NAME_LABEL'),
              email: l10n('USERS_FIELD_EMAIL_LABEL'),
              phone: l10n('USERS_FIELD_PHONE_LABEL'),
              address: l10n('USERS_FIELD_ADDRESS_LABEL'),
              optional: l10n('USERS_FIELD_OPTIONAL'),
            },
            fieldErrors: {
              nameRequired: l10n('USERS_FIELD_NAME_REQUIRED'),
              nameTooLong: l10n('USERS_FIELD_NAME_TOO_LONG'),
              emailInvalid: l10n('USERS_FIELD_EMAIL_INVALID'),
              phoneTooLong: l10n('USERS_FIELD_PHONE_TOO_LONG'),
              addressTooLong: l10n('USERS_FIELD_ADDRESS_TOO_LONG'),
            },
            emailHint: l10n('PROFILE_EMAIL_HINT'),
            pendingTitle: l10n('PROFILE_PENDING_TITLE'),
            pendingDescription: l10n('PROFILE_PENDING_DESCRIPTION'),
            pendingCancelHint: l10n('PROFILE_PENDING_CANCEL_HINT'),
            submit: l10n('PROFILE_SUBMIT'),
            working: l10n('USERS_DIALOG_WORKING'),
            toastSaved: l10n('PROFILE_TOAST_SAVED'),
            toastEmailSent: l10n('PROFILE_TOAST_EMAIL_SENT'),
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
      </section>
    </div>
  );
}
