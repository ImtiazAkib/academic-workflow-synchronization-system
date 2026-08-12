import { Download } from 'lucide-react';

import { MaterialDto } from '@/types';

import { formatFileSize, groupMaterialsByCourse } from '@/lib/utils';

import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';

import type { StudentCourseOption, StudentMaterialLabels } from './student.types';

type StudentMaterialListProps = {
  materials: MaterialDto[];
  courses: StudentCourseOption[];
  labels: StudentMaterialLabels;
};

/*
  A section per course rather than one flat table with a course column, which is what
  "organized by course code" actually asks for: a student opens this page to find the
  handout for one course, not to sort forty files.

  There is no delete and no upload here, and no `canManage` flag that could turn one on.
  The student area has no write path - the absence is the guarantee.
*/
export function StudentMaterialList({ materials, courses, labels }: StudentMaterialListProps) {
  const groups = groupMaterialsByCourse(materials, courses);

  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ course, materials: courseMaterials }) => (
        <section key={course.courseId} className="flex flex-col gap-2">
          <header className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h2 className="text-regular-semibold">{course.code}</h2>
            <span className="text-muted-foreground text-sm">{course.title}</span>
          </header>

          {courseMaterials.length === 0 ? (
            <p className="border-border text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-sm">{labels.noFiles}</p>
          ) : (
            // The wrapper scrolls and the table keeps its natural width, so columns never crush.
            <div className="border-border w-full overflow-x-auto rounded-lg border">
              <Table aria-label={`${course.code} - ${labels.tableLabel}`} className="min-w-xl">
                <TableHeader>
                  <TableRow>
                    <TableHead>{labels.columnTitle}</TableHead>
                    <TableHead>{labels.columnSize}</TableHead>
                    <TableHead className="text-end">{labels.columnActions}</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {courseMaterials.map(x => (
                    <TableRow key={x.materialId}>
                      <TableCell className="font-medium">
                        <span className="block">{x.title}</span>
                        <span className="text-muted-foreground block text-xs">{x.fileName}</span>
                      </TableCell>

                      <TableCell className="text-muted-foreground">{formatFileSize(x.size)}</TableCell>

                      <TableCell className="text-end">
                        {/*
                          A plain link, not a fetch: the route replies with `Content-Disposition:
                          attachment`, so the browser saves the file and never navigates away.
                        */}
                        <Button variant="outline" size="sm" nativeButton={false} render={<a href={`/api/materials/${x.materialId}/download`} />}>
                          <Download className="size-3.5" />
                          {labels.download}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
