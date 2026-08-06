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
 * Database layer errors for Courses (12000-12999).
 */
export const COURSES_DATABASE = {
  LIST_FAILED: createErrorDefinition(12000, 'Failed to list courses'),
  FIND_BY_ID_FAILED: createErrorDefinition(12001, 'Failed to find course'),
  CREATE_FAILED: createErrorDefinition(12002, 'Failed to create course'),
  UPDATE_FAILED: createErrorDefinition(12003, 'Failed to update course'),
} as const;

/**
 * Validation layer errors for Courses (22000-22999).
 */
export const COURSES_VALIDATION = {
  COURSE_NOT_FOUND: createErrorDefinition(22000, 'Course not found.'),
  CODE_ALREADY_USED: createErrorDefinition(22001, 'That course code is already registered.'),
  TEACHER_NOT_FOUND: createErrorDefinition(22002, 'That teacher no longer exists.'),
  TEACHER_INVALID_ROLE: createErrorDefinition(22003, 'Only a teacher can be assigned to a course.'),
} as const;

/**
 * Business layer errors for Courses (32000-32999).
 */
export const COURSES_BUSINESS = {
  COURSE_HAS_SESSIONS: createErrorDefinition(32000, 'Deactivate the scheduled sessions before deactivating this course.'),
} as const;
