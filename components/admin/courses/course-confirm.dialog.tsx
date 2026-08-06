'use client';

import { CourseDto } from '@/types';

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui';

import type { CoursesConfirmLabels } from './courses.types';

type CourseConfirmDialogProps = {
  course: CourseDto | null;
  labels: CoursesConfirmLabels;
  cancelLabel: string;
  workingLabel: string;
  isWorking: boolean;
  error: string | null;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

/*
  Deactivate and reactivate are the same dialog with different words. The course is
  named on its own line rather than interpolated into the description, because the
  description is looked up on the server where the row is not yet known.
*/
export function CourseConfirmDialog({
  course,
  labels,
  cancelLabel,
  workingLabel,
  isWorking,
  error,
  onConfirm,
  onOpenChange,
}: CourseConfirmDialogProps) {
  const handleConfirmClick = (): void => {
    onConfirm();
  };

  const handleCancelClick = (): void => {
    onOpenChange(false);
  };

  return (
    <Dialog open={Boolean(course)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        {course && (
          <div className="bg-muted/50 rounded-md px-3 py-2 text-sm">
            <span className="block font-medium">{course.code}</span>
            <span className="text-muted-foreground block text-xs">{course.title}</span>
          </div>
        )}

        {error && (
          <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" disabled={isWorking} onClick={handleCancelClick}>
            {cancelLabel}
          </Button>

          <Button type="button" variant="appPrimary" disabled={isWorking} onClick={handleConfirmClick}>
            {isWorking ? workingLabel : labels.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
