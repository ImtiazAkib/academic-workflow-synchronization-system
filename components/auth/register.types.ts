import type { RegistrationErrorLabels } from '@/lib/utils';

/**
 * Every string the two registration forms render.
 *
 * One bundle for both, even though the teacher form uses four of the fields: the shapes
 * would otherwise drift, and a label that stops being used stops being passed anyway.
 */
export type RegisterFormLabels = {
  name: string;
  email: string;
  password: string;
  roll: string;
  registrationNo: string;
  session: string;
  sessionPlaceholder: string;
  department: string;
  semester: string;
  showPassword: string;
  hidePassword: string;
  submit: string;
  submitting: string;
  fieldErrors: {
    nameRequired: string;
    emailInvalid: string;
    passwordTooShort: string;
    required: string;
  };
  errors: RegistrationErrorLabels;
};
