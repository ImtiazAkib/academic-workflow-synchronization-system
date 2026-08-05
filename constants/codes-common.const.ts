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
 * Database layer errors shared by every feature (10000-10999).
 */
export const COMMON_DATABASE = {
  CONNECTION_FAILED: createErrorDefinition(10000, 'Failed to connect to the database'),
  QUERY_FAILED: createErrorDefinition(10001, 'Failed to read from the database'),
  WRITE_FAILED: createErrorDefinition(10002, 'Failed to write to the database'),
} as const;

/**
 * Validation layer errors shared by every feature (20000-20999).
 */
export const COMMON_VALIDATION = {
  INVALID_INPUT: createErrorDefinition(20000, 'Invalid input data'),
  REQUIRED_FIELD_MISSING: createErrorDefinition(20001, 'A required field is missing'),
  RESOURCE_NOT_FOUND: createErrorDefinition(20002, 'Resource not found'),
} as const;

/**
 * Business layer errors shared by every feature (30000-30999).
 */
export const COMMON_BUSINESS = {
  OPERATION_NOT_ALLOWED: createErrorDefinition(30000, 'Operation is not allowed'),
  UNEXPECTED_FAILURE: createErrorDefinition(30001, 'An unexpected error occurred'),
} as const;

/**
 * Authentication and authorization errors (50000-50999).
 */
export const COMMON_AUTH = {
  NOT_AUTHENTICATED: createErrorDefinition(50000, 'You are not signed in'),
  NOT_AUTHORIZED: createErrorDefinition(50001, 'Your role does not allow this action'),
  SESSION_EXPIRED: createErrorDefinition(50002, 'Your session has expired'),
} as const;
