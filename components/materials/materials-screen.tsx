'use client';

import { useMemo, useState, useTransition } from 'react';

import { Upload } from 'lucide-react';
import { toast } from 'sonner';

import { useRouter } from '@/l10n/navigation';
import { MaterialDto } from '@/types';

import { isSuccess } from '@/lib/result';
import { resolveMaterialErrorMessage, resolveMaterialType } from '@/lib/utils';

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui';

import { deleteMaterialAction } from './actions';
import { MaterialEditForm } from './material-edit.form';
import { MaterialUploadForm } from './material-upload.form';
import { MaterialsEmpty } from './materials-empty';
import { MaterialsList } from './materials-list';
import { MaterialsToolbar } from './materials-toolbar';

import type { MaterialCourseOption, MaterialsLabels } from './materials.types';

type MaterialsScreenProps = {
  materials: MaterialDto[];
  courses: MaterialCourseOption[];
  labels: MaterialsLabels;
  storageBlocked: boolean;
  storageNearFull: boolean;
};

/**
 * The teacher's repository: a focused toolbar, then the files already published.
 */
export function MaterialsScreen({ materials, courses, labels, storageBlocked, storageNearFull }: MaterialsScreenProps) {
  const router = useRouter();
  const [isWorking, startWorking] = useTransition();

  const [removing, setRemoving] = useState<MaterialDto | null>(null);
  const [editing, setEditing] = useState<MaterialDto | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState('all');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('date');

  const visibleMaterials = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return materials
      .filter(
        material =>
          (!query || `${material.title} ${material.fileName}`.toLocaleLowerCase().includes(query)) &&
          (courseId === 'all' || material.courseId === courseId) &&
          (type === 'all' || resolveMaterialType(material.mimeType, material.fileName) === type)
      )
      .sort((first, second) =>
        sort === 'name'
          ? first.title.localeCompare(second.title)
          : sort === 'size'
            ? second.size - first.size
            : new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
      );
  }, [courseId, materials, search, sort, type]);

  const handleRemove = (material: MaterialDto): void => {
    setRemoveError(null);
    setRemoving(material);
  };

  const handleUpdate = (payload: FormData): void => {
    if (!editing) return;
    const target = editing;
    startWorking(async () => {
      setEditError(null);
      const response = await fetch(`/api/materials/${target.materialId}`, { method: 'PATCH', body: payload });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setEditError(resolveMaterialErrorMessage(body?.errors?.[0]?.code ?? 0, labels.errors));
        return;
      }
      setEditing(null);
      toast.success(labels.toastUpdated);
      router.refresh();
    });
  };

  const handleRemoveConfirm = (): void => {
    if (!removing) {
      return;
    }

    const target = removing;

    startWorking(async () => {
      const result = await deleteMaterialAction(target.materialId);

      if (!isSuccess(result)) {
        setRemoveError(resolveMaterialErrorMessage(result.errors[0]?.code ?? 0, labels.errors));

        return;
      }

      setRemoving(null);
      toast.success(labels.toastDeleted);
      router.refresh();
    });
  };

  const handleRemovingOpenChange = (open: boolean): void => {
    if (!open) {
      setRemoving(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">{labels.count}</p>
        <Button type="button" onClick={() => setUploadOpen(true)} disabled={courses.length === 0 || storageBlocked}>
          <Upload className="size-4" />
          {labels.uploadCta}
        </Button>
      </div>

      <MaterialsToolbar
        courses={courses}
        labels={labels}
        search={search}
        courseId={courseId}
        type={type}
        sort={sort}
        onSearchChange={setSearch}
        onCourseChange={setCourseId}
        onTypeChange={setType}
        onSortChange={setSort}
      />

      {materials.length === 0 ? (
        <MaterialsEmpty title={labels.emptyTitle} description={labels.emptyDescription} />
      ) : (
        <MaterialsList materials={visibleMaterials} courses={courses} labels={labels} onRemove={handleRemove} onEdit={setEditing} />
      )}

      <Dialog open={Boolean(editing)} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{labels.editTitle}</DialogTitle>
            <DialogDescription>{labels.editDescription}</DialogDescription>
          </DialogHeader>
          {editing && (
            <MaterialEditForm
              material={editing}
              working={isWorking}
              error={editError}
              labels={labels}
              onCancel={() => setEditing(null)}
              onSave={handleUpdate}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        {/* Cap the height and scroll inside, like the edit dialog: the course, title, description and tall dropzone overrun a short viewport otherwise. */}
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{labels.uploadTitle}</DialogTitle>
            <DialogDescription>{labels.uploadDescription}</DialogDescription>
          </DialogHeader>
          <MaterialUploadForm
            courses={courses}
            labels={labels}
            storageBlocked={storageBlocked}
            storageNearFull={storageNearFull}
            onUploaded={() => setUploadOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(removing)} onOpenChange={handleRemovingOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{labels.deleteTitle}</DialogTitle>
            <DialogDescription>{labels.deleteDescription}</DialogDescription>
          </DialogHeader>

          {removing && (
            <div className="bg-muted/50 rounded-md px-3 py-2 text-sm">
              <span className="block font-medium">{removing.title}</span>
              <span className="text-muted-foreground block text-xs break-all">{removing.fileName}</span>
            </div>
          )}

          {removeError && (
            <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
              {removeError}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={isWorking} onClick={() => handleRemovingOpenChange(false)}>
              {labels.cancel}
            </Button>

            <Button type="button" variant="default" disabled={isWorking} onClick={handleRemoveConfirm}>
              {isWorking ? labels.deleting : labels.deleteConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
