import type { UserErrorLabels } from '@/lib/utils';

/**
 * Every string the users screen renders.
 *
 * One bundle rather than three dozen individual props: the screen is a client tree and
 * the convention is that server components do the lookup, so all of it has to cross the
 * boundary together.
 */
export type UsersFieldLabels = {
  name: string;
  email: string;
  password: string;
  role: string;
  designation: string;
  studentId: string;
  phone: string;
  optional: string;
};

export type UsersFieldErrorLabels = {
  nameRequired: string;
  nameTooLong: string;
  emailInvalid: string;
  passwordTooShort: string;
  roleInvalid: string;
  designationTooLong: string;
  studentIdTooLong: string;
  phoneTooLong: string;
};

/**
 * What the standalone create screen needs — a slice of `UsersLabels` rather than the
 * whole bundle, because that page renders no table, filters or confirmations.
 */
export type UserCreateFormLabels = {
  fields: UsersFieldLabels;
  fieldErrors: UsersFieldErrorLabels;
  roleAdmin: string;
  roleTeacher: string;
  roleStudent: string;
  submit: string;
  working: string;
  cancel: string;
  created: string;
  errors: UserErrorLabels;
};

export type UsersConfirmLabels = {
  title: string;
  description: string;
  confirm: string;
};

export type UsersLabels = {
  createCta: string;
  search: string;
  searchPlaceholder: string;
  roleFilter: string;
  statusFilter: string;
  all: string;
  clearFilters: string;
  statusPending: string;
  statusActive: string;
  statusInactive: string;
  roleAdmin: string;
  roleTeacher: string;
  roleStudent: string;
  tableLabel: string;
  columnName: string;
  columnEmail: string;
  columnRole: string;
  columnStatus: string;
  columnActions: string;
  count: string;
  emptyTitle: string;
  emptyDescription: string;
  edit: string;
  approve: string;
  revoke: string;
  deactivate: string;
  reactivate: string;
  fields: UsersFieldLabels;
  fieldErrors: UsersFieldErrorLabels;
  createTitle: string;
  createDescription: string;
  createSubmit: string;
  editTitle: string;
  editDescription: string;
  editSubmit: string;
  approveDialog: UsersConfirmLabels;
  revokeDialog: UsersConfirmLabels;
  deactivateDialog: UsersConfirmLabels;
  reactivateDialog: UsersConfirmLabels;
  cancel: string;
  working: string;
  toastCreated: string;
  toastUpdated: string;
  toastApproved: string;
  toastRevoked: string;
  toastDeactivated: string;
  toastReactivated: string;
  errors: UserErrorLabels;
};
