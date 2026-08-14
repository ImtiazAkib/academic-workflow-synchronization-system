import { MaterialDto } from '@/types';

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui';

import { MaterialRow } from './material-row';

import type { MaterialCourseOption, MaterialsLabels } from './materials.types';

type MaterialsListProps = {
  materials: MaterialDto[];
  courses: MaterialCourseOption[];
  labels: MaterialsLabels;
  onRemove: (material: MaterialDto) => void;
  onEdit: (material: MaterialDto) => void;
};

export function MaterialsList({ materials, courses, labels, onRemove, onEdit }: MaterialsListProps) {
  return (
    // Title and actions always show; the secondary columns appear from md up. The title cell
    // wraps (see MaterialRow), so the table fits a phone instead of scrolling sideways.
    <div className="border-border w-full overflow-x-auto rounded-lg border">
      <Table aria-label={labels.tableLabel}>
        <TableHeader>
          <TableRow>
            <TableHead>{labels.columnTitle}</TableHead>
            <TableHead className="hidden md:table-cell">{labels.columnCourse}</TableHead>
            <TableHead className="hidden md:table-cell">{labels.columnSize}</TableHead>
            <TableHead className="hidden md:table-cell">{labels.columnDate}</TableHead>
            <TableHead className="text-end">{labels.columnActions}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {materials.map(x => (
            <MaterialRow key={x.materialId} material={x} courses={courses} labels={labels} onRemove={onRemove} onEdit={onEdit} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
