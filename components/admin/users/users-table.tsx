import { UserDto } from '@/types';

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui';

import { UsersTableRow } from './users-table-row';

import type { UsersLabels } from './users.types';

type UsersTableProps = {
  users: UserDto[];
  labels: UsersLabels;
  onEdit: (user: UserDto) => void;
  onApproval: (user: UserDto) => void;
  onActivation: (user: UserDto) => void;
};

export function UsersTable({ users, labels, onEdit, onApproval, onActivation }: UsersTableProps) {
  return (
    /*
      The wrapper scrolls and the table refuses to go below its natural width. Without
      that floor the browser honours the 100% width instead and crushes every column —
      which is what put three action buttons on top of each other on a phone.
    */
    <div className="border-border w-full overflow-x-auto rounded-lg border">
      <Table aria-label={labels.tableLabel} className="min-w-3xl">
        <TableHeader>
          <TableRow>
            <TableHead>{labels.columnName}</TableHead>
            <TableHead>{labels.columnEmail}</TableHead>
            <TableHead>{labels.columnRole}</TableHead>
            <TableHead>{labels.columnStatus}</TableHead>
            <TableHead className="text-end">{labels.columnActions}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map(x => (
            <UsersTableRow key={x.userId} user={x} labels={labels} onEdit={onEdit} onApproval={onApproval} onActivation={onActivation} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
