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
 * Database layer errors for Materials (14000-14999).
 */
export const MATERIALS_DATABASE = {
  LIST_FAILED: createErrorDefinition(14000, 'Failed to list materials'),
  FIND_BY_ID_FAILED: createErrorDefinition(14001, 'Failed to find material'),
  CREATE_FAILED: createErrorDefinition(14002, 'Failed to save material'),
  DELETE_FAILED: createErrorDefinition(14003, 'Failed to delete material'),
  STORAGE_FAILED: createErrorDefinition(14004, 'Failed to read or write the file'),
  UPDATE_FAILED: createErrorDefinition(14005, 'Failed to update material'),
} as const;

/**
 * Validation layer errors for Materials (24000-24999).
 */
export const MATERIALS_VALIDATION = {
  MATERIAL_NOT_FOUND: createErrorDefinition(24000, 'That file no longer exists.'),
  COURSE_NOT_FOUND: createErrorDefinition(24001, 'Choose a course that exists.'),
  FILE_REQUIRED: createErrorDefinition(24002, 'Choose a file to upload.'),
  FILE_TOO_LARGE: createErrorDefinition(24003, 'That file is larger than the 25 MB limit.'),
  FILE_TYPE_NOT_ALLOWED: createErrorDefinition(24004, 'That file type is not accepted.'),
  TITLE_REQUIRED: createErrorDefinition(24005, 'Enter a title.'),
  TITLE_TOO_LONG: createErrorDefinition(24006, 'Title cannot exceed 200 characters.'),
} as const;

/**
 * Authorization errors for Materials (54000-54999).
 */
export const MATERIALS_AUTH = {
  NOT_OWN_COURSE: createErrorDefinition(54000, 'You can only upload to a course you are assigned to.'),
  NOT_OWN_MATERIAL: createErrorDefinition(54001, 'You can only delete a file you uploaded.'),
  DOWNLOAD_NOT_ALLOWED: createErrorDefinition(54002, 'You are not allowed to download this file.'),
} as const;
