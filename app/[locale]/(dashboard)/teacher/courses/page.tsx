import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { CourseService } from '@/lib/services';
import { resolveSemesterLabel } from '@/lib/utils';

import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';

const courseService = new CourseService();

type TeacherCoursesPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: TeacherCoursesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('TEACHER_COURSES_METADATA_TITLE'),
    robots: { index: false, follow: false },
  };
}

/*
  Read-only. A teacher does not create or edit a course — an administrator assigns them
  — so this is a list, not a screen with state. Scoped by the session rather than a
  query parameter.
*/
export default async function TeacherCoursesPage() {
  const sessionUser = await requireRole(USER_ROLES.TEACHER);

  const l10n = await getTranslations();

  const courseResult = await courseService.list();
  const courses = courseResult.result.filter(x => x.assignedTeacherId === sessionUser.userId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl">{l10n('TEACHER_COURSES_TITLE')}</h1>
        <p className="text-muted-foreground text-sm">{l10n('TEACHER_COURSES_INTRO')}</p>
      </div>

      {courses.length === 0 ? (
        <div className="border-border flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-14 text-center">
          <p className="text-regular-semibold">{l10n('TEACHER_COURSES_EMPTY_TITLE')}</p>
          <p className="text-muted-foreground max-w-sm text-sm">{l10n('TEACHER_COURSES_EMPTY_DESCRIPTION')}</p>
        </div>
      ) : (
        <div className="border-border w-full overflow-x-auto rounded-lg border">
          <Table aria-label={l10n('TEACHER_COURSES_TITLE')} className="min-w-2xl">
            <TableHeader>
              <TableRow>
                <TableHead>{l10n('COURSES_TABLE_CODE')}</TableHead>
                <TableHead>{l10n('COURSES_TABLE_TITLE')}</TableHead>
                <TableHead>{l10n('COURSES_TABLE_SEMESTER')}</TableHead>
                <TableHead>{l10n('COURSES_TABLE_CREDITS')}</TableHead>
                <TableHead>{l10n('COURSES_TABLE_STATUS')}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {courses.map(x => (
                <TableRow key={x.courseId}>
                  <TableCell className="font-medium">{x.code}</TableCell>
                  <TableCell>{x.title}</TableCell>
                  <TableCell>{resolveSemesterLabel(x.semester)}</TableCell>
                  <TableCell>{x.credits}</TableCell>
                  <TableCell>
                    <Badge variant={x.isActive ? 'default' : 'destructive'}>
                      {x.isActive ? l10n('COURSES_STATUS_ACTIVE') : l10n('COURSES_STATUS_INACTIVE')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
