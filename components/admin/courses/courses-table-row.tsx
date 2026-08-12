import { MoreHorizontal, Pencil, Power } from 'lucide-react';

import { CourseDto } from '@/types';

import { resolveSemesterLabel } from '@/lib/utils';

import { Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, TableCell, TableRow } from '@/components/ui';

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
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{course.title}</span>
          <span className="text-muted-foreground font-mono text-xs">{course.code}</span>
        </div>
      </TableCell>

      <TableCell className="text-muted-foreground">{resolveSemesterLabel(course.semester)}</TableCell>

      <TableCell className="text-muted-foreground">{course.credits}</TableCell>

      <TableCell className={teacherName ? undefined : 'text-muted-foreground'}>{teacherName ?? labels.unassigned}</TableCell>

      <TableCell>
        <Badge variant={course.isActive ? 'success' : 'neutral'}>{course.isActive ? labels.statusActive : labels.statusInactive}</Badge>
      </TableCell>

      <TableCell className="text-end">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label={labels.columnActions} />}>
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleEditClick}>
              <Pencil />
              {labels.edit}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleActivationClick}>
              <Power />
              {course.isActive ? labels.deactivate : labels.reactivate}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
