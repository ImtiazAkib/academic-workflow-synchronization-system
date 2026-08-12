'use client';

import { UserDto } from '@/types';

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui';

import type { UsersConfirmLabels } from './users.types';

type UserConfirmDialogProps = {
  user: UserDto | null;
  labels: UsersConfirmLabels;
  cancelLabel: string;
  workingLabel: string;
  isWorking: boolean;
  error: string | null;
  /** A red confirm button for the one action that cannot be taken back - delete. */
  destructive?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

/*
  Approve, revoke, deactivate and reactivate are the same dialog with different words -
  a title, a sentence, and one button. Four near-identical files would drift; this takes
  its copy as props instead.

  The account being acted on is named in its own line rather than interpolated into the
  description, because the description is looked up on the server where the row is not
  yet known.
*/
export function UserConfirmDialog({
  user,
  labels,
  cancelLabel,
  workingLabel,
  isWorking,
  error,
  destructive = false,
  onConfirm,
  onOpenChange,
}: UserConfirmDialogProps) {
  const handleConfirmClick = (): void => {
    onConfirm();
  };

  const handleCancelClick = (): void => {
    onOpenChange(false);
  };

  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        {user && (
          <div className="bg-muted/50 rounded-md px-3 py-2 text-sm">
            <span className="block font-medium">{user.name}</span>
            <span className="text-muted-foreground block text-xs break-all">{user.email}</span>
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

          <Button type="button" variant={destructive ? 'destructive' : 'default'} disabled={isWorking} onClick={handleConfirmClick}>
            {isWorking ? workingLabel : labels.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
