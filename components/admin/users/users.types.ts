import type { UserErrorLabels } from '@/lib/utils';

/**
 * Who is looking at the screen, and therefore what it may offer them.
 *
 * The screens use this to decide which roles a select lists and which buttons a row
 * carries. It is a courtesy, not a control - `UserService` refuses the same operations
 * whatever the browser sends, so a button that should not be there is a cosmetic bug
 * rather than a hole.
 */
export type UsersViewer = {
  userId: string;
  isSuperAdmin: boolean;
};

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
  roll: string;
  registrationNo: string;
  session: string;
  sessionUnset: string;
  department: string;
  semester: string;
  semesterUnset: string;
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
  rollTooLong: string;
  rollDigitsOnly: string;
  registrationNoTooLong: string;
  registrationNoDigitsOnly: string;
  sessionTooLong: string;
  departmentTooLong: string;
  semesterInvalid: string;
  phoneInvalid: string;
};

/**
 * What the standalone create screen needs - a slice of `UsersLabels` rather than the
 * whole bundle, because that page renders no table, filters or confirmations.
 */
export type UserCreateFormLabels = {
  fields: UsersFieldLabels;
  fieldErrors: UsersFieldErrorLabels;
  roleSuperAdmin: string;
  roleAdmin: string;
  roleTeacher: string;
  roleStudent: string;
  showPassword: string;
  hidePassword: string;
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
  title: string;
  intro: string;
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
  roleSuperAdmin: string;
  roleAdmin: string;
  roleTeacher: string;
  roleStudent: string;
  tableLabel: string;
  columnName: string;
  columnEmail: string;
  columnRole: string;
  columnDepartmentBatch: string;
  columnJoined: string;
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
  delete: string;
  actionsUnavailable: string;
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
  deleteDialog: UsersConfirmLabels;
  cancel: string;
  working: string;
  toastCreated: string;
  toastUpdated: string;
  toastApproved: string;
  toastRevoked: string;
  toastDeactivated: string;
  toastReactivated: string;
  toastDeleted: string;
  errors: UserErrorLabels;
};
