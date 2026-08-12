import type { PasswordChangeErrorLabels, UserErrorLabels } from '@/lib/utils';

/**
 * One read-only fact about the account, already resolved to strings by the page.
 *
 * The screen renders a list of these rather than a fixed set of rows, because which
 * facts exist depends on the role - a teacher has a designation and no session, a
 * student the reverse, an administrator neither. A row per field with a conditional
 * around each would be the same list written twice as long.
 */
export type ProfileFact = {
  label: string;
  value: string;
};

/**
 * A course a teacher is assigned, reduced to what the profile shows.
 */
export type ProfileCourse = {
  courseId: string;
  code: string;
  semester: number;
};

export type ProfileFieldLabels = {
  name: string;
  email: string;
  phone: string;
  address: string;
  optional: string;
};

export type ProfileFieldErrorLabels = {
  nameRequired: string;
  nameTooLong: string;
  emailInvalid: string;
  phoneInvalid: string;
  addressTooLong: string;
};

/**
 * Every string the edit form renders.
 *
 * One bundle rather than a dozen props: the form is a client component and the
 * convention is that the server component does the lookup, so all of it crosses the
 * boundary together.
 */
export type ProfileEditLabels = {
  fields: ProfileFieldLabels;
  fieldErrors: ProfileFieldErrorLabels;
  emailHint: string;
  pendingTitle: string;
  pendingDescription: string;
  pendingCancelHint: string;
  submit: string;
  working: string;
  toastSaved: string;
  toastEmailSent: string;
  errors: UserErrorLabels;
};

/**
 * Every string the change-password form renders.
 *
 * Its own bundle, apart from `ProfileEditLabels`, because it is its own form with its own
 * action - the two share the screen and nothing else. The field errors are named per rule
 * so the form can show the right one from the react-hook-form error type, the same way the
 * edit form does.
 */
export type ProfilePasswordLabels = {
  fields: {
    current: string;
    new: string;
    confirm: string;
  };
  fieldErrors: {
    currentRequired: string;
    newTooShort: string;
    newTooLong: string;
    mismatch: string;
  };
  showPassword: string;
  hidePassword: string;
  submit: string;
  working: string;
  toastSaved: string;
  errors: PasswordChangeErrorLabels;
};

export type ProfileLoginIdLabels = {
  title: string;
  description: string;
  empty: string;
  copy: string;
  copied: string;
};

export type ProfileSummaryLabels = {
  loginId: ProfileLoginIdLabels;
  recordTitle: string;
  recordHint: string;
  coursesTitle: string;
  coursesEmpty: string;
};
