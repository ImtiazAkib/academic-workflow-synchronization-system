'use client';

import { useState, useTransition } from 'react';

import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { Link, useRouter } from '@/l10n/navigation';
import { UserDto } from '@/types';

import { ROUTES } from '@/constants/routes.const';

import { isSuccess } from '@/lib/result';
import { resolveUserErrorMessage } from '@/lib/utils';

import { Button } from '@/components/ui';

import { approveUserAction, deactivateUserAction, deleteUserAction } from './actions';
import { UserConfirmDialog } from './user-confirm.dialog';
import { UserEditDialog } from './user-edit.dialog';
import { UsersEmpty } from './users-empty';
import { UsersFilters } from './users-filters';
import { UsersTable } from './users-table';

import type { UsersLabels, UsersViewer } from './users.types';

type UsersScreenProps = {
  users: UserDto[];
  labels: UsersLabels;
  viewer: UsersViewer;
};

/*
  The one client component on this screen. The table and its dialogs share which row is
  selected and whether an action is in flight, so splitting that state across siblings
  would only mean lifting it back up again.

  Every mutation ends in `router.refresh()`: the list is server-rendered, so re-running
  the server component is what makes the change appear — and it re-applies the current
  URL filters for free.
*/
export function UsersScreen({ users, labels, viewer }: UsersScreenProps) {
  const router = useRouter();
  const [isWorking, startWorking] = useTransition();

  const [editing, setEditing] = useState<UserDto | null>(null);
  const [approving, setApproving] = useState<UserDto | null>(null);
  const [activating, setActivating] = useState<UserDto | null>(null);
  const [deleting, setDeleting] = useState<UserDto | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const handleEdit = (user: UserDto): void => {
    setEditing(user);
  };

  const handleUpdated = (): void => {
    setEditing(null);
    toast.success(labels.toastUpdated);
    router.refresh();
  };

  const handleApproval = (user: UserDto): void => {
    setConfirmError(null);
    setApproving(user);
  };

  const handleActivation = (user: UserDto): void => {
    setConfirmError(null);
    setActivating(user);
  };

  const handleDelete = (user: UserDto): void => {
    setConfirmError(null);
    setDeleting(user);
  };

  const handleApprovalConfirm = (): void => {
    if (!approving) {
      return;
    }

    const target = approving;
    const isApproved = !target.isApproved;

    startWorking(async () => {
      const result = await approveUserAction({ userId: target.userId, isApproved });

      if (!isSuccess(result)) {
        setConfirmError(resolveUserErrorMessage(result.errors[0]?.code ?? 0, labels.errors));

        return;
      }

      setApproving(null);
      toast.success(isApproved ? labels.toastApproved : labels.toastRevoked);
      router.refresh();
    });
  };

  const handleActivationConfirm = (): void => {
    if (!activating) {
      return;
    }

    const target = activating;
    const isActive = !target.isActive;

    startWorking(async () => {
      const result = await deactivateUserAction({ userId: target.userId, isActive });

      if (!isSuccess(result)) {
        setConfirmError(resolveUserErrorMessage(result.errors[0]?.code ?? 0, labels.errors));

        return;
      }

      setActivating(null);
      toast.success(isActive ? labels.toastReactivated : labels.toastDeactivated);
      router.refresh();
    });
  };

  const handleDeleteConfirm = (): void => {
    if (!deleting) {
      return;
    }

    const target = deleting;

    startWorking(async () => {
      const result = await deleteUserAction({ userId: target.userId });

      if (!isSuccess(result)) {
        setConfirmError(resolveUserErrorMessage(result.errors[0]?.code ?? 0, labels.errors));

        return;
      }

      setDeleting(null);
      toast.success(labels.toastDeleted);
      router.refresh();
    });
  };

  const handleEditOpenChange = (open: boolean): void => {
    if (!open) {
      setEditing(null);
    }
  };

  const handleApprovingOpenChange = (open: boolean): void => {
    if (!open) {
      setApproving(null);
    }
  };

  const handleActivatingOpenChange = (open: boolean): void => {
    if (!open) {
      setActivating(null);
    }
  };

  const handleDeletingOpenChange = (open: boolean): void => {
    if (!open) {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl">{labels.title}</h1>
          <p className="text-muted-foreground text-sm">{labels.intro}</p>
          <p className="text-muted-foreground text-xs">{labels.count}</p>
        </div>

        {/* Creating an account is its own page now, so this is a link, not a trigger. */}
        <Button variant="default" nativeButton={false} render={<Link href={ROUTES.ADMIN_USERS_NEW.HREF} />}>
          <UserPlus className="size-4" />
          {labels.createCta}
        </Button>
      </div>

      <UsersFilters labels={labels} />

      {users.length === 0 ? (
        <UsersEmpty title={labels.emptyTitle} description={labels.emptyDescription} />
      ) : (
        <UsersTable
          users={users}
          labels={labels}
          viewer={viewer}
          onEdit={handleEdit}
          onApproval={handleApproval}
          onActivation={handleActivation}
          onDelete={handleDelete}
        />
      )}

      {editing && (
        <UserEditDialog key={editing.userId} user={editing} labels={labels} onUpdated={handleUpdated} onOpenChange={handleEditOpenChange} />
      )}

      <UserConfirmDialog
        user={approving}
        labels={approving?.isApproved ? labels.revokeDialog : labels.approveDialog}
        cancelLabel={labels.cancel}
        workingLabel={labels.working}
        isWorking={isWorking}
        error={confirmError}
        onConfirm={handleApprovalConfirm}
        onOpenChange={handleApprovingOpenChange}
      />

      <UserConfirmDialog
        user={activating}
        labels={activating?.isActive ? labels.deactivateDialog : labels.reactivateDialog}
        cancelLabel={labels.cancel}
        workingLabel={labels.working}
        isWorking={isWorking}
        error={confirmError}
        onConfirm={handleActivationConfirm}
        onOpenChange={handleActivatingOpenChange}
      />

      <UserConfirmDialog
        user={deleting}
        labels={labels.deleteDialog}
        cancelLabel={labels.cancel}
        workingLabel={labels.working}
        isWorking={isWorking}
        error={confirmError}
        destructive
        onConfirm={handleDeleteConfirm}
        onOpenChange={handleDeletingOpenChange}
      />
    </div>
  );
}
