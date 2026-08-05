import { UserDto } from '@/types';

import { resolveUserRoleLabel, resolveUserStatus, resolveUserStatusLabel } from '@/lib/utils';

import { Badge, Button, TableCell, TableRow } from '@/components/ui';

import type { UsersLabels } from './users.types';

type UsersTableRowProps = {
  user: UserDto;
  labels: UsersLabels;
  onEdit: (user: UserDto) => void;
  onApproval: (user: UserDto) => void;
  onActivation: (user: UserDto) => void;
};

export function UsersTableRow({ user, labels, onEdit, onApproval, onActivation }: UsersTableRowProps) {
  const status = resolveUserStatus(user);

  const roleLabel = resolveUserRoleLabel(user.role, {
    admin: labels.roleAdmin,
    teacher: labels.roleTeacher,
    student: labels.roleStudent,
  });

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
        {user.studentId && <span className="text-muted-foreground block text-xs">{user.studentId}</span>}
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
          <Button type="button" variant="outline" size="sm" onClick={handleEditClick}>
            {labels.edit}
          </Button>

          <Button type="button" variant="outline" size="sm" onClick={handleApprovalClick}>
            {user.isApproved ? labels.revoke : labels.approve}
          </Button>

          <Button type="button" variant="outline" size="sm" onClick={handleActivationClick}>
            {user.isActive ? labels.deactivate : labels.reactivate}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
