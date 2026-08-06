import type { Metadata } from 'next';

import { FolderOpen, GraduationCap } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { StudentService } from '@/lib/services';
import { resolveSemesterLabel } from '@/lib/utils';

import { StudentEmpty, StudentMaterialList } from '@/components/student';

const studentService = new StudentService();

type StudentMaterialsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: StudentMaterialsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('STUDENT_MATERIALS_METADATA_TITLE'),
    robots: { index: false, follow: false },
  };
}

/*
  The files published against the courses in the student's own semester, organized by
  course code. No upload control and no delete button — not hidden ones, absent ones:
  `StudentMaterialList` has no action props to switch on.

  Downloading still goes through `/api/materials/[id]/download`, which admits any signed-in
  account. That is deliberate and unchanged: this page decides what is worth listing, not
  what a student is permitted to hold.
*/
export default async function StudentMaterialsPage() {
  const sessionUser = await requireRole(USER_ROLES.STUDENT);

  const l10n = await getTranslations();

  const semester = await studentService.resolveSemester(sessionUser.userId);

  if (!semester) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl">{l10n('STUDENT_MATERIALS_TITLE')}</h1>
          <p className="text-muted-foreground text-sm">{l10n('STUDENT_MATERIALS_INTRO')}</p>
        </div>

        <StudentEmpty icon={GraduationCap} title={l10n('STUDENT_NO_SEMESTER_TITLE')} description={l10n('STUDENT_NO_SEMESTER_DESCRIPTION')} />
      </div>
    );
  }

  const [courseResult, materialResult] = await Promise.all([studentService.listCourses(semester), studentService.listMaterials(semester)]);

  const courses = courseResult.result.map(x => ({ courseId: x.courseId, code: x.code, title: x.title }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl">{l10n('STUDENT_MATERIALS_TITLE')}</h1>
        <p className="text-muted-foreground text-sm">{l10n('STUDENT_MATERIALS_INTRO')}</p>
        <p className="text-muted-foreground text-xs">
          {l10n('STUDENT_SEMESTER_BADGE', { semester: resolveSemesterLabel(semester) })} ·{' '}
          {l10n('MATERIALS_COUNT', { count: materialResult.result.length })}
        </p>
      </div>

      {courses.length === 0 ? (
        <StudentEmpty icon={FolderOpen} title={l10n('STUDENT_MATERIALS_EMPTY_TITLE')} description={l10n('STUDENT_MATERIALS_EMPTY_DESCRIPTION')} />
      ) : (
        <StudentMaterialList
          materials={materialResult.result}
          courses={courses}
          labels={{
            tableLabel: l10n('MATERIALS_TABLE_LABEL'),
            columnTitle: l10n('MATERIALS_TABLE_TITLE'),
            columnSize: l10n('MATERIALS_TABLE_SIZE'),
            columnActions: l10n('MATERIALS_TABLE_ACTIONS'),
            download: l10n('MATERIALS_ACTION_DOWNLOAD'),
            noFiles: l10n('STUDENT_MATERIALS_COURSE_EMPTY'),
          }}
        />
      )}
    </div>
  );
}
