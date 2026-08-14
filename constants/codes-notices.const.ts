/**
 * Helper function to create error definition.
 *
 * @param code - Error code.
 * @param message - Error message.
 *
 * @returns Error definition object.
 */
const createErrorDefinition = (code: number, message: string) => ({ CODE: code, MESSAGE: message }) as const;

/**
 * Database layer errors for Notices (15000-15999).
 */
export const NOTICES_DATABASE = {
  LIST_FAILED: createErrorDefinition(15000, 'Failed to list notices'),
  CREATE_FAILED: createErrorDefinition(15001, 'Failed to create notice'),
  DELETE_FAILED: createErrorDefinition(15002, 'Failed to delete notice'),
  UPDATE_FAILED: createErrorDefinition(15003, 'Failed to update notice'),
} as const;

/**
 * Validation layer errors for Notices (25000-25999).
 */
export const NOTICES_VALIDATION = {
  TITLE_REQUIRED: createErrorDefinition(25000, 'Give the notice a title.'),
  TITLE_TOO_LONG: createErrorDefinition(25001, 'A title cannot exceed 200 characters.'),
  BODY_REQUIRED: createErrorDefinition(25002, 'Write something to announce.'),
  BODY_TOO_LONG: createErrorDefinition(25003, 'A notice cannot exceed 5000 characters.'),
  AUDIENCE_INVALID: createErrorDefinition(25004, 'Choose who this notice is for.'),
  /*
    A notice is text, a picture, or both - but not neither. Raised against the body field
    so the message lands under the textarea, which is where somebody who announced nothing
    is already looking.
  */
  BODY_OR_IMAGE_REQUIRED: createErrorDefinition(25005, 'Write an announcement, attach an image, or both.'),
  IMAGE_TOO_LARGE: createErrorDefinition(25006, 'That image is larger than the 5 MB limit.'),
  IMAGE_TYPE_NOT_ALLOWED: createErrorDefinition(25007, 'Attach a PNG, JPEG, WebP image or a PDF.'),
  NOTICE_NOT_FOUND: createErrorDefinition(25008, 'That notice no longer exists.'),
  CATEGORY_INVALID: createErrorDefinition(25009, 'Choose whether this is a general or a session notice.'),
  SESSIONS_REQUIRED: createErrorDefinition(25010, 'Choose at least one session for a session notice.'),
  TOO_MANY_SESSIONS: createErrorDefinition(25011, 'That is more sessions than one notice may target.'),
} as const;

/**
 * Authorization errors for Notices (55000-55999).
 */
export const NOTICES_AUTH = {
  /*
    Reading a notice image is the one place a notice's audience becomes an access rule
    rather than a filter. The feed simply never lists a notice somebody may not see; the
    image URL is guessable, so it has to be refused outright.
  */
  NOT_IN_AUDIENCE: createErrorDefinition(55000, 'That notice was not addressed to you.'),
  /*
    A teacher publishes to students - a general notice to all of them, or a session notice
    to the intakes they name. Posting to the staff room, or department-wide, is the
    administrator's. The form never offers a teacher those, so this is the guard for a
    request built by hand.
  */
  TEACHER_STUDENTS_ONLY: createErrorDefinition(55001, 'A teacher can only publish notices to students.'),
  /*
    A teacher may edit or delete only a notice they published. Distinct from
    TEACHER_STUDENTS_ONLY, which is an audience restriction on publishing, not an ownership
    denial on an existing notice - conflating the two under one code mislabels the refusal.
  */
  NOT_OWN_NOTICE: createErrorDefinition(55002, 'You can only change a notice you published.'),
} as const;
