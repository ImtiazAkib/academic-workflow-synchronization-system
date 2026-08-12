import { Archive, Download, File, FileImage, FileSpreadsheet, FileText, FileType, MoreHorizontal, Presentation, Trash2 } from 'lucide-react';

import { MaterialDto } from '@/types';

import { formatFileSize, resolveMaterialType } from '@/lib/utils';

import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, TableCell, TableRow } from '@/components/ui';

import type { MaterialCourseOption, MaterialsLabels } from './materials.types';

type MaterialRowProps = {
  material: MaterialDto;
  courses: MaterialCourseOption[];
  labels: MaterialsLabels;
  onRemove: (material: MaterialDto) => void;
};

export function MaterialRow({ material, courses, labels, onRemove }: MaterialRowProps) {
  const course = courses.find(x => x.courseId === material.courseId);
  const type = resolveMaterialType(material.mimeType, material.fileName);
  const TypeIcon = {
    pdf: FileType,
    document: FileText,
    presentation: Presentation,
    spreadsheet: FileSpreadsheet,
    image: FileImage,
    archive: Archive,
    text: FileText,
    file: File,
  }[type];

  const handleRemoveClick = (): void => {
    onRemove(material);
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex min-w-48 items-center gap-3">
          <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
            <TypeIcon className="size-4" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium">{material.title}</span>
            <span className="text-muted-foreground truncate text-xs">
              {material.fileName} · {type}
            </span>
          </span>
        </div>
      </TableCell>

      <TableCell>{course?.code ?? '—'}</TableCell>

      <TableCell className="text-muted-foreground">{formatFileSize(material.size)}</TableCell>

      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{new Date(material.createdAt).toLocaleDateString()}</TableCell>

      <TableCell className="text-end">
        <div className="flex justify-end gap-1">
          {/*
            A plain link, not a fetch: the route replies with `Content-Disposition:
            attachment`, so the browser saves the file and never navigates away.
          */}
          <Button variant="outline" size="sm" nativeButton={false} render={<a href={`/api/materials/${material.materialId}/download`} />}>
            <Download className="size-3.5" />
            {labels.download}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label={labels.columnActions} />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem variant="destructive" onClick={handleRemoveClick}>
                <Trash2 />
                {labels.remove}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
