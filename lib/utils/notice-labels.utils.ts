import type { NoticeCreateFormLabels } from '@/components/notices';

import type { getTranslations } from 'next-intl/server';

// Type-only: `next-intl/server` reaches for `next/headers`, which a client bundle
// cannot resolve. Only the translator's shape is needed here.
type Translator = Awaited<ReturnType<typeof getTranslations>>;

/**
 * Every string the notice publish form renders.
 *
 * Shared by the administrator's page and the teacher's so a field cannot be labelled one
 * way on one and another way on the other — the same reason `buildRegisterLabels` exists.
 * The form itself decides what to show from its props (a teacher gets no audience picker);
 * the copy is the same either way.
 *
 * @param l10n - Translator from the calling server component.
 *
 * @returns The full label bundle.
 */
export function buildNoticeCreateLabels(l10n: Translator): NoticeCreateFormLabels {
  return {
    fields: {
      title: l10n('NOTICES_FIELD_TITLE_LABEL'),
      body: l10n('NOTICES_FIELD_BODY_LABEL'),
      audience: l10n('NOTICES_FIELD_AUDIENCE_LABEL'),
      image: l10n('NOTICES_FIELD_IMAGE_LABEL'),
      category: l10n('NOTICES_FIELD_CATEGORY_LABEL'),
      sessions: l10n('NOTICES_FIELD_SESSIONS_LABEL'),
    },
    fieldErrors: {
      titleRequired: l10n('NOTICES_FIELD_TITLE_REQUIRED'),
      titleTooLong: l10n('NOTICES_FIELD_TITLE_TOO_LONG'),
      bodyOrImageRequired: l10n('NOTICES_FIELD_BODY_OR_IMAGE_REQUIRED'),
      bodyTooLong: l10n('NOTICES_FIELD_BODY_TOO_LONG'),
      audienceInvalid: l10n('NOTICES_FIELD_AUDIENCE_INVALID'),
      imageTooLarge: l10n('NOTICES_FIELD_IMAGE_TOO_LARGE'),
      imageType: l10n('NOTICES_FIELD_IMAGE_TYPE'),
      sessionsRequired: l10n('NOTICES_FIELD_SESSIONS_REQUIRED'),
    },
    audiences: {
      all: l10n('NOTICES_AUDIENCE_ALL'),
      teachers: l10n('NOTICES_AUDIENCE_TEACHERS'),
      students: l10n('NOTICES_AUDIENCE_STUDENTS'),
    },
    categories: {
      general: l10n('NOTICES_CATEGORY_GENERAL'),
      session: l10n('NOTICES_CATEGORY_SESSION'),
    },
    audienceHint: l10n('NOTICES_FIELD_AUDIENCE_HINT'),
    categoryHint: l10n('NOTICES_FIELD_CATEGORY_HINT'),
    sessionsHint: l10n('NOTICES_FIELD_SESSIONS_HINT'),
    noSessions: l10n('NOTICES_FIELD_NO_SESSIONS'),
    imageHint: l10n('NOTICES_FIELD_IMAGE_HINT'),
    imagePreviewAlt: l10n('NOTICES_IMAGE_PREVIEW_ALT'),
    imageRemove: l10n('NOTICES_IMAGE_REMOVE'),
    attachmentRemove: l10n('NOTICES_ATTACHMENT_REMOVE'),
    dropTitle: l10n('NOTICES_DROPZONE_TITLE'),
    dropSelected: l10n('NOTICES_DROPZONE_SELECTED'),
    dropHint: l10n('NOTICES_DROPZONE_HINT'),
    storageWarning: l10n('NOTICES_STORAGE_WARNING'),
    storageFull: l10n('NOTICES_STORAGE_FULL'),
    submit: l10n('NOTICES_CREATE_SUBMIT'),
    working: l10n('NOTICES_DIALOG_WORKING'),
    cancel: l10n('NOTICES_DIALOG_CANCEL'),
    published: l10n('NOTICES_TOAST_PUBLISHED'),
    errors: {
      titleRequired: l10n('NOTICES_ERROR_TITLE'),
      bodyOrImageRequired: l10n('NOTICES_ERROR_BODY_OR_IMAGE'),
      audienceInvalid: l10n('NOTICES_ERROR_AUDIENCE'),
      imageTooLarge: l10n('NOTICES_ERROR_IMAGE_TOO_LARGE'),
      imageType: l10n('NOTICES_ERROR_IMAGE_TYPE'),
      storageFull: l10n('NOTICES_ERROR_STORAGE_FULL'),
      generic: l10n('NOTICES_ERROR_GENERIC'),
    },
  };
}
