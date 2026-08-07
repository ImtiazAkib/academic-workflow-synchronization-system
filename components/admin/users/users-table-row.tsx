import { UserDto } from '@/types';

import { USER_ROLES } from '@/constants/roles.const';

import { resolveSemesterLabel, resolveUserRoleLabel, resolveUserStatus, resolveUserStatusLabel } from '@/lib/utils';

import { Badge, Button, TableCell, TableRow } from '@/components/ui';

import type { UsersLabels, UsersViewer } from './users.types';

type UsersTableRowProps = {
  user: UserDto;
  labels: UsersLabels;
  viewer: UsersViewer;
  onEdit: (user: UserDto) => void;
  onApproval: (user: UserDto) => void;
  onActivation: (user: UserDto) => void;
};

export function UsersTableRow({ user, labels, viewer, onEdit, onApproval, onActivation }: UsersTableRowProps) {
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
    service refuses these regardless of what the browser sends — rendering a button that
    can only ever produce a refusal is the thing being avoided here, not a hole being
    closed.
  */
  const isImmutable = user.role === USER_ROLES.SUPER_ADMIN;
  const isForeignAdmin = user.role === USER_ROLES.ADMIN && !viewer.isSuperAdmin;

  const canEdit = !isImmutable && !isForeignAdmin;
  // Approval and activation decide whether an account can sign in, so never your own.
  const canChangeAccess = canEdit && !isSelf;

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

  return (
    <TableRow>
      <TableCell className="font-medium">
        <span className="block">{user.name}</span>
        {user.designation && <span className="text-muted-foreground block text-xs">{user.designation}</span>}
        {user.roll && <span className="text-muted-foreground block text-xs">{user.roll}</span>}
        {/* The year a student's routine is filtered by — worth seeing without opening the dialog. */}
        {user.semester && <span className="text-muted-foreground block text-xs">{resolveSemesterLabel(user.semester)}</span>}
      </TableCell>

      <TableCell className="text-muted-foreground">{user.email}</TableCell>

      <TableCell>{roleLabel}</TableCell>

      <TableCell>
        <Badge variant={status === 'active' ? 'default' : status === 'pending' ? 'secondary' : 'destructive'}>{statusLabel}</Badge>
      </TableCell>

      <TableCell>
        {/*
          A three-column grid rather than a flex row: the middle label changes per row
          ("Approve" / "Revoke"), and under flex that shifts every button beside it, so
          nothing lines up down the column. Equal tracks keep the columns straight.
        */}
        <div className="grid grid-cols-3 gap-1.5">
          {canEdit && (
            <Button type="button" variant="outline" size="sm" onClick={handleEditClick}>
              {labels.edit}
            </Button>
          )}

          {canChangeAccess && (
            <Button type="button" variant="outline" size="sm" onClick={handleApprovalClick}>
              {user.isApproved ? labels.revoke : labels.approve}
            </Button>
          )}

          {canChangeAccess && (
            <Button type="button" variant="outline" size="sm" onClick={handleActivationClick}>
              {user.isActive ? labels.deactivate : labels.reactivate}
            </Button>
          )}

          {/* The seeded account, and your own: nothing here is yours to change. */}
          {!canEdit && <span className="text-muted-foreground col-span-3 text-xs">{labels.actionsUnavailable}</span>}
        </div>
      </TableCell>
    </TableRow>
  );
}
