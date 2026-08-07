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
  ROLL_TOO_LONG: createErrorDefinition(21009, 'Roll number cannot exceed 40 characters.'),
  USER_NOT_FOUND: createErrorDefinition(21010, 'User not found.'),
  EMAIL_ALREADY_USED: createErrorDefinition(21011, 'That email address is already registered.'),
  SEMESTER_INVALID: createErrorDefinition(21012, 'Choose a semester between 1 and 8.'),
  ROLL_REQUIRED: createErrorDefinition(21013, 'Enter your roll number.'),
  ROLL_ALREADY_USED: createErrorDefinition(21014, 'That roll number is already registered.'),
  REGISTRATION_NO_REQUIRED: createErrorDefinition(21015, 'Enter your registration number.'),
  REGISTRATION_NO_TOO_LONG: createErrorDefinition(21016, 'Registration number cannot exceed 40 characters.'),
  SESSION_REQUIRED: createErrorDefinition(21017, 'Enter your session.'),
  SESSION_TOO_LONG: createErrorDefinition(21018, 'Session cannot exceed 20 characters.'),
  DEPARTMENT_REQUIRED: createErrorDefinition(21019, 'Enter your department.'),
  DEPARTMENT_TOO_LONG: createErrorDefinition(21020, 'Department cannot exceed 120 characters.'),
  ADDRESS_TOO_LONG: createErrorDefinition(21021, 'Address cannot exceed 200 characters.'),
  VERIFICATION_LINK_INVALID: createErrorDefinition(21022, 'That confirmation link is not valid.'),
  VERIFICATION_LINK_EXPIRED: createErrorDefinition(21023, 'That confirmation link has expired.'),
} as const;

/**
 * Business layer errors for Users (31000-31999).
 */
export const USERS_BUSINESS = {
  /*
    31000 was `LAST_ADMIN_CANNOT_BE_REMOVED`, retired in step 11. It existed to stop a
    department locking itself out of the admin area; a permanent super administrator who
    owns the whole administrator lifecycle makes that impossible, and administrators can
    no longer deactivate each other or themselves, so nothing could reach it. The number
    is left unused rather than recycled — a stale code in an old log should decode to
    nothing, not to somebody else's message.
  */
  ADMIN_LIMIT_REACHED: createErrorDefinition(31001, 'The department already has three administrators.'),
  CANNOT_CHANGE_OWN_ACCESS: createErrorDefinition(31002, 'You cannot change your own role or access.'),
  SUPER_ADMIN_IS_IMMUTABLE: createErrorDefinition(31003, 'The super administrator account is seeded, and cannot be created or changed here.'),
  /*
    The generator derives a sequence from a count and the unique index refuses a
    collision, so it retries. Exhausting the retries means something is genuinely wrong
    rather than merely contended — reported rather than looped forever.
  */
  LOGIN_ID_NOT_ISSUED: createErrorDefinition(31004, 'Could not issue a login ID. Try again.'),
} as const;

/**
 * Authentication errors for Users (51000-51999).
 */
export const USERS_AUTH = {
  /*
    Deliberately the same error for an unknown email and a wrong password. Telling
    the two apart lets anyone test which addresses have accounts here.
  */
  INVALID_CREDENTIALS: createErrorDefinition(51000, 'Email or password is incorrect.'),
  ACCOUNT_NOT_APPROVED: createErrorDefinition(51001, 'This account is waiting for administrator approval.'),
  ACCOUNT_DEACTIVATED: createErrorDefinition(51002, 'This account has been deactivated.'),
  SIGN_IN_FAILED: createErrorDefinition(51003, 'Sign-in could not be completed. Try again.'),
  /*
    An authorization refusal rather than a business one: the operation is legitimate,
    the caller is not the one allowed to make it.
  */
  ADMIN_MANAGED_BY_SUPER_ADMIN: createErrorDefinition(51004, 'Only the super administrator can manage administrator accounts.'),
  /*
    A different refusal from ACCOUNT_NOT_APPROVED, and it has to be: "check your inbox"
    and "wait for the department" are different problems with different remedies, and
    one message for both leaves the visitor with nothing to act on.
  */
  EMAIL_NOT_VERIFIED: createErrorDefinition(51005, 'Confirm your email address before signing in.'),
  /*
    Raised only after the password matched, so it tells somebody who already owns the
    account how to get in — rather than telling a stranger which addresses exist.
  */
  SIGN_IN_WITH_LOGIN_ID: createErrorDefinition(51006, 'Sign in with your login ID rather than your email address.'),
} as const;
