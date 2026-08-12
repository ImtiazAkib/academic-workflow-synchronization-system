import { MaterialDto } from '@/types';

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui';

import { MaterialRow } from './material-row';

import type { MaterialCourseOption, MaterialsLabels } from './materials.types';

type MaterialsListProps = {
  materials: MaterialDto[];
  courses: MaterialCourseOption[];
  labels: MaterialsLabels;
  onRemove: (material: MaterialDto) => void;
};

export function MaterialsList({ materials, courses, labels, onRemove }: MaterialsListProps) {
  return (
    // The wrapper scrolls and the table keeps its natural width, so columns never crush.
    <div className="border-border w-full overflow-x-auto rounded-lg border">
      <Table aria-label={labels.tableLabel} className="min-w-3xl">
        <TableHeader>
          <TableRow>
            <TableHead>{labels.columnTitle}</TableHead>
            <TableHead>{labels.columnCourse}</TableHead>
            <TableHead>{labels.columnSize}</TableHead>
            <TableHead>{labels.columnDate}</TableHead>
            <TableHead className="text-end">{labels.columnActions}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {materials.map(x => (
            <MaterialRow key={x.materialId} material={x} courses={courses} labels={labels} onRemove={onRemove} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
