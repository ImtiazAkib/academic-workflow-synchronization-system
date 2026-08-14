import { Archive, Download, File, FileImage, FilePenLine, FileSpreadsheet, FileText, FileType, Presentation, Trash2 } from 'lucide-react';

import { MaterialDto } from '@/types';

import { formatFileSize, resolveMaterialType } from '@/lib/utils';

import { MultimediaViewer } from '@/components/shared';
import { Button, TableCell, TableRow } from '@/components/ui';

import type { MaterialCourseOption, MaterialsLabels } from './materials.types';

type MaterialRowProps = {
  material: MaterialDto;
  courses: MaterialCourseOption[];
  labels: MaterialsLabels;
  onRemove: (material: MaterialDto) => void;
  onEdit: (material: MaterialDto) => void;
};

export function MaterialRow({ material, courses, labels, onRemove, onEdit }: MaterialRowProps) {
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
      {/* `whitespace-normal` lets the title wrap - the table cell defaults to nowrap, which on a phone forced a 1000px+ row that scrolled sideways. */}
      <TableCell className="whitespace-normal">
        <div className="flex min-w-0 items-center gap-3">
          <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
            <TypeIcon className="size-4" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium">{material.title}</span>
            {/* `break-all` not `truncate`: a nowrap filename's intrinsic width forced the whole column wide in the table's auto layout, so the row could not shrink to a phone. */}
            <span className="text-muted-foreground text-xs break-all">
              {material.fileName} · {type}
            </span>
            {/* Stacked under the title inside the min-w-0 column, not wedged between the icon and title as a middle column that pushed every row's title out of line. */}
            {material.description && <span className="text-muted-foreground line-clamp-2 text-xs">{material.description}</span>}
          </span>
        </div>
      </TableCell>

      {/* Course, size and date are secondary - hidden on phones so the table fits, shown from md up. */}
      <TableCell className="hidden md:table-cell">{course?.code ?? '-'}</TableCell>

      <TableCell className="text-muted-foreground hidden md:table-cell">{formatFileSize(material.size)}</TableCell>

      <TableCell className="text-muted-foreground hidden text-sm whitespace-nowrap md:table-cell">
        {new Date(material.createdAt).toLocaleDateString()}
      </TableCell>

      <TableCell className="text-end">
        <div className="flex flex-wrap justify-end gap-1">
          <MultimediaViewer
            title={material.title}
            mimeType={material.mimeType}
            source={`/api/materials/${material.materialId}/view`}
            downloadSource={`/api/materials/${material.materialId}/download`}
            labels={labels.viewer}
          />
          {/* Icon-only on phones (label via aria-label), text from md up - four labelled buttons otherwise overran the row. */}
          <Button type="button" variant="outline" size="sm" aria-label={labels.edit} onClick={() => onEdit(material)}>
            <FilePenLine className="size-3.5" />
            <span className="hidden md:inline">{labels.edit}</span>
          </Button>
          {/*
            A plain link, not a fetch: the route replies with `Content-Disposition:
            attachment`, so the browser saves the file and never navigates away.
          */}
          <Button
            variant="outline"
            size="sm"
            aria-label={labels.download}
            nativeButton={false}
            render={<a href={`/api/materials/${material.materialId}/download`} />}>
            <Download className="size-3.5" />
            <span className="hidden md:inline">{labels.download}</span>
          </Button>

          <Button type="button" variant="destructive" size="sm" aria-label={labels.remove} onClick={handleRemoveClick}>
            <Trash2 className="size-3.5" />
            <span className="hidden md:inline">{labels.remove}</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
