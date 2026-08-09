'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';

import { useRouter } from '@/l10n/navigation';
import { MaterialDto } from '@/types';

import { isSuccess } from '@/lib/result';
import { resolveMaterialErrorMessage } from '@/lib/utils';

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui';

import { deleteMaterialAction } from './actions';
import { MaterialUploadForm } from './material-upload.form';
import { MaterialsEmpty } from './materials-empty';
import { MaterialsList } from './materials-list';

import type { MaterialCourseOption, MaterialsLabels } from './materials.types';

type MaterialsScreenProps = {
  materials: MaterialDto[];
  courses: MaterialCourseOption[];
  labels: MaterialsLabels;
};

/**
 * The teacher's repository: the upload form, then everything already published.
 */
export function MaterialsScreen({ materials, courses, labels }: MaterialsScreenProps) {
  const router = useRouter();
  const [isWorking, startWorking] = useTransition();

  const [removing, setRemoving] = useState<MaterialDto | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const handleRemove = (material: MaterialDto): void => {
    setRemoveError(null);
    setRemoving(material);
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
      <div className="surface-card flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-regular-semibold">{labels.uploadTitle}</h2>
          <p className="text-muted-foreground text-sm">{labels.uploadDescription}</p>
        </div>

        <MaterialUploadForm courses={courses} labels={labels} />
      </div>

      {materials.length === 0 ? (
        <MaterialsEmpty title={labels.emptyTitle} description={labels.emptyDescription} />
      ) : (
        <MaterialsList materials={materials} courses={courses} labels={labels} onRemove={handleRemove} />
      )}

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

            <Button type="button" variant="appPrimary" disabled={isWorking} onClick={handleRemoveConfirm}>
              {labels.deleteConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
