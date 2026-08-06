import { Download, Trash2 } from 'lucide-react';

import { MaterialDto } from '@/types';

import { formatFileSize } from '@/lib/utils';

import { Button, TableCell, TableRow } from '@/components/ui';

import type { MaterialCourseOption, MaterialsLabels } from './materials.types';

type MaterialRowProps = {
  material: MaterialDto;
  courses: MaterialCourseOption[];
  labels: MaterialsLabels;
  onRemove: (material: MaterialDto) => void;
};

export function MaterialRow({ material, courses, labels, onRemove }: MaterialRowProps) {
  const course = courses.find(x => x.courseId === material.courseId);

  const handleRemoveClick = (): void => {
    onRemove(material);
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <span className="block">{material.title}</span>
        <span className="text-muted-foreground block text-xs">{material.fileName}</span>
      </TableCell>

      <TableCell>{course?.code ?? '—'}</TableCell>

      <TableCell className="text-muted-foreground">{formatFileSize(material.size)}</TableCell>

      <TableCell>
        <div className="grid grid-cols-2 gap-1.5">
          {/*
            A plain link, not a fetch: the route replies with `Content-Disposition:
            attachment`, so the browser saves the file and never navigates away.
          */}
          <Button variant="outline" size="sm" nativeButton={false} render={<a href={`/api/materials/${material.materialId}/download`} />}>
            <Download className="size-3.5" />
            {labels.download}
          </Button>

          <Button type="button" variant="outline" size="sm" onClick={handleRemoveClick}>
            <Trash2 className="size-3.5" />
            {labels.remove}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
