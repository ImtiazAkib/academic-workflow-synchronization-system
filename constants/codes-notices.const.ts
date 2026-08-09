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
} as const;

/*
  No business or authorization layer here, and their absence is the design rather than an
  omission. Publishing is the admin area's alone, which `gateAdminArea()` already answers
  before the service is reached; and a notice has no state to be in — it is written once,
  addressed to a group, and read. There is nothing left for a rule to refuse.
*/
