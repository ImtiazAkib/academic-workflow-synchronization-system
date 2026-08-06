import { CourseDto } from '@/types';

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui';

import { CoursesTableRow } from './courses-table-row';

import type { CoursesLabels, TeacherOption } from './courses.types';

type CoursesTableProps = {
  courses: CourseDto[];
  teachers: TeacherOption[];
  labels: CoursesLabels;
  onEdit: (course: CourseDto) => void;
  onActivation: (course: CourseDto) => void;
};

export function CoursesTable({ courses, teachers, labels, onEdit, onActivation }: CoursesTableProps) {
  return (
    /*
      The wrapper scrolls and the table refuses to go below its natural width. Without
      that floor the browser honours the 100% width and crushes every column, which is
      what stacks the action buttons on a phone.
    */
    <div className="border-border w-full overflow-x-auto rounded-lg border">
      <Table aria-label={labels.tableLabel} className="min-w-3xl">
        <TableHeader>
          <TableRow>
            <TableHead>{labels.columnCode}</TableHead>
            <TableHead>{labels.columnTitle}</TableHead>
            <TableHead>{labels.columnSemester}</TableHead>
            <TableHead>{labels.columnCredits}</TableHead>
            <TableHead>{labels.columnTeacher}</TableHead>
            <TableHead>{labels.columnStatus}</TableHead>
            <TableHead className="text-end">{labels.columnActions}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {courses.map(x => (
            <CoursesTableRow key={x.courseId} course={x} teachers={teachers} labels={labels} onEdit={onEdit} onActivation={onActivation} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
