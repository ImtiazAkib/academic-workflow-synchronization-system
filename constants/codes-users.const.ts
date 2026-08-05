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
 * Database layer errors for Users (11000-11999).
 */
export const USERS_DATABASE = {
  LIST_FAILED: createErrorDefinition(11000, 'Failed to list users'),
  FIND_BY_ID_FAILED: createErrorDefinition(11001, 'Failed to find user'),
  FIND_BY_EMAIL_FAILED: createErrorDefinition(11002, 'Failed to find user by email'),
  CREATE_FAILED: createErrorDefinition(11003, 'Failed to create user'),
  UPDATE_FAILED: createErrorDefinition(11004, 'Failed to update user'),
} as const;

/**
 * Validation layer errors for Users (21000-21999).
 */
export const USERS_VALIDATION = {
  NAME_REQUIRED: createErrorDefinition(21000, 'Name is required.'),
  NAME_TOO_LONG: createErrorDefinition(21001, 'Name cannot exceed 120 characters.'),
  EMAIL_REQUIRED: createErrorDefinition(21002, 'Email is required.'),
  EMAIL_INVALID: createErrorDefinition(21003, 'Enter a valid email address.'),
  PASSWORD_TOO_SHORT: createErrorDefinition(21004, 'Password must be at least 8 characters.'),
  PASSWORD_TOO_LONG: createErrorDefinition(21005, 'Password cannot exceed 128 characters.'),
  ROLE_INVALID: createErrorDefinition(21006, 'Choose a valid role.'),
  PHONE_TOO_LONG: createErrorDefinition(21007, 'Phone number cannot exceed 40 characters.'),
  DESIGNATION_TOO_LONG: createErrorDefinition(21008, 'Designation cannot exceed 120 characters.'),
  STUDENT_ID_TOO_LONG: createErrorDefinition(21009, 'Student ID cannot exceed 40 characters.'),
  USER_NOT_FOUND: createErrorDefinition(21010, 'User not found.'),
  EMAIL_ALREADY_USED: createErrorDefinition(21011, 'That email address is already registered.'),
} as const;

/**
 * Business layer errors for Users (31000-31999).
 */
export const USERS_BUSINESS = {
  ACCOUNT_NOT_APPROVED: createErrorDefinition(31000, 'This account is waiting for administrator approval.'),
  ACCOUNT_DEACTIVATED: createErrorDefinition(31001, 'This account has been deactivated.'),
  LAST_ADMIN_CANNOT_BE_REMOVED: createErrorDefinition(31002, 'The last administrator cannot be deactivated.'),
} as const;
