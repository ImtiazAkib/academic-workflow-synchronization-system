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
    A notice is text, a picture, or both — but not neither. Raised against the body field
    so the message lands under the textarea, which is where somebody who announced nothing
    is already looking.
  */
  BODY_OR_IMAGE_REQUIRED: createErrorDefinition(25005, 'Write an announcement, attach an image, or both.'),
  IMAGE_TOO_LARGE: createErrorDefinition(25006, 'That image is larger than the 5 MB limit.'),
  IMAGE_TYPE_NOT_ALLOWED: createErrorDefinition(25007, 'Attach a PNG, JPEG or WebP image.'),
  NOTICE_NOT_FOUND: createErrorDefinition(25008, 'That notice no longer exists.'),
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
} as const;
