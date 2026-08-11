import type { RegisterFormLabels } from '@/components/auth';

import type { getTranslations } from 'next-intl/server';

// Type-only: `next-intl/server` reaches for `next/headers`, which a client bundle
// cannot resolve. Only the translator's shape is needed here.
type Translator = Awaited<ReturnType<typeof getTranslations>>;

/**
 * Every string the two registration forms render.
 *
 * Shared by the student and teacher pages so a field cannot be labelled one way on one
 * form and another way on the other — the same reason `buildScheduleLabels` exists.
 *
 * Written as literal `l10n('KEY')` calls rather than a loop over key names, because the
 * editor integration only finds keys in that form.
 *
 * @param l10n - Translator from the calling server component.
 *
 * @returns The full label bundle.
 */
export function buildRegisterLabels(l10n: Translator): RegisterFormLabels {
  return {
    name: l10n('REGISTER_FIELD_NAME'),
    email: l10n('REGISTER_FIELD_EMAIL'),
    password: l10n('REGISTER_FIELD_PASSWORD'),
    roll: l10n('REGISTER_FIELD_ROLL'),
    registrationNo: l10n('REGISTER_FIELD_REGISTRATION_NO'),
    session: l10n('REGISTER_FIELD_SESSION'),
    department: l10n('REGISTER_FIELD_DEPARTMENT'),
    semester: l10n('REGISTER_FIELD_SEMESTER'),
    showPassword: l10n('PASSWORD_SHOW'),
    hidePassword: l10n('PASSWORD_HIDE'),
    submit: l10n('REGISTER_SUBMIT'),
    submitting: l10n('REGISTER_SUBMITTING'),
    fieldErrors: {
      nameRequired: l10n('USERS_FIELD_NAME_REQUIRED'),
      emailInvalid: l10n('USERS_FIELD_EMAIL_INVALID'),
      passwordTooShort: l10n('USERS_FIELD_PASSWORD_TOO_SHORT'),
      required: l10n('REGISTER_FIELD_REQUIRED'),
      digitsOnly: l10n('REGISTER_FIELD_DIGITS_ONLY'),
    },
    errors: {
      emailTaken: l10n('REGISTER_ERROR_EMAIL_TAKEN'),
      rollTaken: l10n('REGISTER_ERROR_ROLL_TAKEN'),
      tooManyAttempts: l10n('ERROR_TOO_MANY_ATTEMPTS'),
      generic: l10n('REGISTER_ERROR_GENERIC'),
    },
  };
}
