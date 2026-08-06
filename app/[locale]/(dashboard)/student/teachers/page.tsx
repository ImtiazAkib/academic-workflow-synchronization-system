import type { Metadata } from 'next';

import { Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { StudentService } from '@/lib/services';

import { StudentEmpty, TeacherDirectory } from '@/components/student';

const studentService = new StudentService();

type StudentTeachersPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: StudentTeachersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('STUDENT_TEACHERS_METADATA_TITLE'),
    robots: { index: false, follow: false },
  };
}

/*
  The one screen where a student reads another account, so what it may show is decided in
  `teacherDirectoryFromEntity` rather than here: name, designation, email and the courses
  they take. No phone number, and no account state.

  Not scoped to the student's own semester. A student asks about the teacher who runs a
  lab, or the one who will supervise a project next year — narrowing the directory to
  five names would make it useless for the question it exists to answer.
*/
export default async function StudentTeachersPage() {
  await requireRole(USER_ROLES.STUDENT);

  const l10n = await getTranslations();

  const teacherResult = await studentService.listTeachers();
  const teachers = teacherResult.result;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl">{l10n('STUDENT_TEACHERS_TITLE')}</h1>
        <p className="text-muted-foreground text-sm">{l10n('STUDENT_TEACHERS_INTRO')}</p>
        <p className="text-muted-foreground text-xs">{l10n('STUDENT_TEACHERS_COUNT', { count: teachers.length })}</p>
      </div>

      {teachers.length === 0 ? (
        <StudentEmpty icon={Users} title={l10n('STUDENT_TEACHERS_EMPTY_TITLE')} description={l10n('STUDENT_TEACHERS_EMPTY_DESCRIPTION')} />
      ) : (
        <TeacherDirectory
          teachers={teachers}
          listLabel={l10n('STUDENT_TEACHERS_TITLE')}
          labels={{
            email: l10n('STUDENT_TEACHERS_EMAIL_LABEL'),
            courses: l10n('STUDENT_TEACHERS_COURSES_LABEL'),
            noCourses: l10n('STUDENT_TEACHERS_NO_COURSES'),
          }}
        />
      )}
    </div>
  );
}
