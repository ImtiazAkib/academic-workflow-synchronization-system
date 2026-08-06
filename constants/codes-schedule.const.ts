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
 * Database layer errors for the Schedule (13000-13999).
 */
export const SCHEDULE_DATABASE = {
  LIST_FAILED: createErrorDefinition(13000, 'Failed to list class sessions'),
  FIND_BY_ID_FAILED: createErrorDefinition(13001, 'Failed to find class session'),
  CREATE_FAILED: createErrorDefinition(13002, 'Failed to create class session'),
  UPDATE_FAILED: createErrorDefinition(13003, 'Failed to update class session'),
  DELETE_FAILED: createErrorDefinition(13004, 'Failed to delete class session'),
} as const;

/**
 * Validation layer errors for the Schedule (23000-23999).
 */
export const SCHEDULE_VALIDATION = {
  SESSION_NOT_FOUND: createErrorDefinition(23000, 'That class session no longer exists.'),
  COURSE_NOT_FOUND: createErrorDefinition(23001, 'Choose a course that exists.'),
  TEACHER_NOT_FOUND: createErrorDefinition(23002, 'Choose a teacher that exists.'),
  TEACHER_INVALID_ROLE: createErrorDefinition(23003, 'Only a teacher can take a class.'),
} as const;

/*
  The three clashes conflict detection refuses. Each is a business rule rather than a
  validation error: the record is well-formed, the slot is simply taken. They come back
  as a failure the dialog renders inline, never as a thrown error.
*/
export const SCHEDULE_BUSINESS = {
  ROOM_TAKEN: createErrorDefinition(33000, 'That room is already booked in this time slot.'),
  TEACHER_BUSY: createErrorDefinition(33001, 'That teacher already has a class in this time slot.'),
  COURSE_ALREADY_SCHEDULED: createErrorDefinition(33002, 'That course is already scheduled in this time slot.'),
} as const;
