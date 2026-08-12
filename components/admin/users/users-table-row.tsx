import { MoreHorizontal, Pencil, Power, ShieldCheck, Trash2 } from 'lucide-react';

import { UserDto } from '@/types';

import { USER_ROLES } from '@/constants/roles.const';

import { resolveInitials, resolveSemesterLabel, resolveUserRoleLabel, resolveUserStatus, resolveUserStatusLabel } from '@/lib/utils';

import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from '@/components/ui';

import type { UsersLabels, UsersViewer } from './users.types';

type UsersTableRowProps = {
  user: UserDto;
  labels: UsersLabels;
  viewer: UsersViewer;
  onEdit: (user: UserDto) => void;
  onApproval: (user: UserDto) => void;
  onActivation: (user: UserDto) => void;
  onDelete: (user: UserDto) => void;
};

export function UsersTableRow({ user, labels, viewer, onEdit, onApproval, onActivation, onDelete }: UsersTableRowProps) {
  const status = resolveUserStatus(user);

  const roleLabel = resolveUserRoleLabel(user.role, {
    superAdmin: labels.roleSuperAdmin,
    admin: labels.roleAdmin,
    teacher: labels.roleTeacher,
    student: labels.roleStudent,
  });

  const isSelf = user.userId === viewer.userId;

  /*
    What this row is allowed to offer, mirroring the rules `UserService` enforces. The
    service refuses these regardless of what the browser sends - rendering a button that
    can only ever produce a refusal is the thing being avoided here, not a hole being
    closed.
  */
  const isImmutable = user.role === USER_ROLES.SUPER_ADMIN;
  const isForeignAdmin = user.role === USER_ROLES.ADMIN && !viewer.isSuperAdmin;

  const canEdit = !isImmutable && !isForeignAdmin;
  // Approval and activation decide whether an account can sign in, so never your own.
  const canChangeAccess = canEdit && !isSelf;
  // Deletion is the same reach as changing access, made permanent - the service agrees.
  const canDelete = canChangeAccess;

  const statusLabel = resolveUserStatusLabel(status, {
    pending: labels.statusPending,
    active: labels.statusActive,
    inactive: labels.statusInactive,
  });

  const handleEditClick = (): void => {
    onEdit(user);
  };

  const handleApprovalClick = (): void => {
    onApproval(user);
  };

  const handleActivationClick = (): void => {
    onActivation(user);
  };

  const handleDeleteClick = (): void => {
    onDelete(user);
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-start gap-2.5">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="text-xs">{resolveInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block font-medium">{user.name}</span>
            {user.designation && <span className="text-muted-foreground block text-xs">{user.designation}</span>}
            {/*
          The identifier the account signs in with. It reaches its owner once, by email,
          and the department needs somewhere to read it back from when that message is
          lost - this is that somewhere.
        */}
            {user.loginId && <span className="text-muted-foreground block font-mono text-xs">{user.loginId}</span>}
            {user.roll && <span className="text-muted-foreground block text-xs">{user.roll}</span>}
            {/* The year a student's routine is filtered by - worth seeing without opening the dialog. */}
            {user.semester && <span className="text-muted-foreground block text-xs">{resolveSemesterLabel(user.semester)}</span>}
          </span>
        </div>
      </TableCell>

      <TableCell className="text-muted-foreground">{user.email}</TableCell>

      <TableCell>{roleLabel}</TableCell>

      <TableCell className="text-muted-foreground">
        <span className="block">{user.department ?? '-'}</span>
        {(user.session || user.semester) && (
          <span className="block text-xs">
            {[user.session, user.semester ? resolveSemesterLabel(user.semester) : null].filter(Boolean).join(' · ')}
          </span>
        )}
      </TableCell>

      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{new Date(user.createdAt).toLocaleDateString()}</TableCell>

      <TableCell>
        <Badge variant={status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'neutral'}>{statusLabel}</Badge>
      </TableCell>

      <TableCell className="text-end">
        {/*
          A two-column grid rather than a flex row: the labels change per row ("Approve" /
          "Revoke", "Deactivate" / "Reactivate"), and under flex that shifts every button
          beside them, so nothing lines up down the column. Equal tracks keep it straight -
          two rows of two when every action is available: edit and access on top, delete
          beneath, set apart by its red so it is not reached for by reflex.
        */}
        {canEdit ? (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label={labels.columnActions} />}>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {canEdit && (
                <DropdownMenuItem onClick={handleEditClick}>
                  <Pencil />
                  {labels.edit}
                </DropdownMenuItem>
              )}

              {canChangeAccess && (
                <DropdownMenuItem onClick={handleApprovalClick}>
                  <ShieldCheck />
                  {user.isApproved ? labels.revoke : labels.approve}
                </DropdownMenuItem>
              )}

              {canChangeAccess && (
                <DropdownMenuItem onClick={handleActivationClick}>
                  <Power />
                  {user.isActive ? labels.deactivate : labels.reactivate}
                </DropdownMenuItem>
              )}

              {canDelete && (
                <DropdownMenuItem variant="destructive" onClick={handleDeleteClick}>
                  <Trash2 />
                  {labels.delete}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="text-muted-foreground text-xs">{labels.actionsUnavailable}</span>
        )}
      </TableCell>
    </TableRow>
  );
}
