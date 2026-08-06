'use client';

import { ClassSessionDto } from '@/types';

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui';

import type { CourseOption, ScheduleConfirmLabels } from './schedule.types';

type SessionDeleteDialogProps = {
  session: ClassSessionDto | null;
  courses: CourseOption[];
  labels: ScheduleConfirmLabels;
  cancelLabel: string;
  workingLabel: string;
  isWorking: boolean;
  error: string | null;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

/**
 * Removal is permanent — a session has nothing hanging off it that needs a valid
 * author, unlike an account — so the class is named before it goes.
 */
export function SessionDeleteDialog({
  session,
  courses,
  labels,
  cancelLabel,
  workingLabel,
  isWorking,
  error,
  onConfirm,
  onOpenChange,
}: SessionDeleteDialogProps) {
  const course = courses.find(x => x.courseId === session?.courseId);

  const handleConfirmClick = (): void => {
    onConfirm();
  };

  const handleCancelClick = (): void => {
    onOpenChange(false);
  };

  return (
    <Dialog open={Boolean(session)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        {session && (
          <div className="bg-muted/50 rounded-md px-3 py-2 text-sm">
            <span className="block font-medium">{course?.code ?? session.courseId}</span>
            <span className="text-muted-foreground block text-xs">
              {session.startTime}–{session.endTime} · {session.room}
            </span>
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
