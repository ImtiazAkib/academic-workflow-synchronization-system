import { CourseDto } from '@/types';

import { Badge, Button, TableCell, TableRow } from '@/components/ui';

import type { CoursesLabels, TeacherOption } from './courses.types';

type CoursesTableRowProps = {
  course: CourseDto;
  teachers: TeacherOption[];
  labels: CoursesLabels;
  onEdit: (course: CourseDto) => void;
  onActivation: (course: CourseDto) => void;
};

export function CoursesTableRow({ course, teachers, labels, onEdit, onActivation }: CoursesTableRowProps) {
  const teacherName = teachers.find(x => x.userId === course.assignedTeacherId)?.name;

  const handleEditClick = (): void => {
    onEdit(course);
  };

  const handleActivationClick = (): void => {
    onActivation(course);
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{course.code}</TableCell>

      <TableCell>{course.title}</TableCell>

      <TableCell>{course.semester}</TableCell>

      <TableCell>{course.credits}</TableCell>

      <TableCell className={teacherName ? undefined : 'text-muted-foreground'}>{teacherName ?? labels.unassigned}</TableCell>

      <TableCell>
        <Badge variant={course.isActive ? 'default' : 'destructive'}>{course.isActive ? labels.statusActive : labels.statusInactive}</Badge>
      </TableCell>

      <TableCell>
        {/* Equal tracks, so the changing middle label cannot shift the column. */}
        <div className="grid grid-cols-2 gap-1.5">
          <Button type="button" variant="outline" size="sm" onClick={handleEditClick}>
            {labels.edit}
          </Button>

          <Button type="button" variant="outline" size="sm" onClick={handleActivationClick}>
            {course.isActive ? labels.deactivate : labels.reactivate}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
