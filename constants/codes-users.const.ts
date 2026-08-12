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
  DELETE_FAILED: createErrorDefinition(11005, 'Failed to delete user'),
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
  // A confirmation with two password boxes: they have to agree before either is saved.
  PASSWORD_MISMATCH: createErrorDefinition(21024, 'Both passwords must match.'),
  // Distinct from the length rule on the new one: an empty current-password box is
  // "you left this blank", not "too short".
  CURRENT_PASSWORD_REQUIRED: createErrorDefinition(21025, 'Enter your current password.'),
  /*
    The resend and forgot-password screens name an unknown address on purpose - the
    department asked for an explicit "no account here" over the silent, enumeration-proof
    "check your inbox". It is a deliberate reversal of the anti-enumeration stance the rest
    of the auth surface keeps (sign-in still refuses to say which addresses exist).
  */
  EMAIL_NOT_REGISTERED: createErrorDefinition(21026, 'No account is registered with that email address.'),
  // A roll number is a number the department issues; letters and dashes were never part of it.
  ROLL_DIGITS_ONLY: createErrorDefinition(21027, 'Roll number must be digits only.'),
  REGISTRATION_NO_DIGITS_ONLY: createErrorDefinition(21028, 'Registration number must be digits only.'),
  // One department, one country: a phone number here is a Bangladesh mobile number.
  PHONE_INVALID: createErrorDefinition(21029, 'Enter a valid Bangladesh mobile number, e.g. 01712345678.'),
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
    is left unused rather than recycled - a stale code in an old log should decode to
    nothing, not to somebody else's message.
  */
  ADMIN_LIMIT_REACHED: createErrorDefinition(31001, 'The department already has three administrators.'),
  CANNOT_CHANGE_OWN_ACCESS: createErrorDefinition(31002, 'You cannot change your own role or access.'),
  SUPER_ADMIN_IS_IMMUTABLE: createErrorDefinition(31003, 'The super administrator account is seeded, and cannot be created or changed here.'),
  /*
    The generator derives a sequence from a count and the unique index refuses a
    collision, so it retries. Exhausting the retries means something is genuinely wrong
    rather than merely contended - reported rather than looped forever.
  */
  LOGIN_ID_NOT_ISSUED: createErrorDefinition(31004, 'Could not issue a login ID. Try again.'),
  /*
    A role is set once, when the account is created, and never moved afterwards. Editing
    an account corrects its name and its departmental fields; it does not turn a teacher
    into an administrator or a student into a teacher. The edit form locks the control, and
    this is the boundary that makes the lock real for a request that skips the form.
  */
  ROLE_IS_IMMUTABLE: createErrorDefinition(31005, 'An account keeps the role it was created with; it cannot be changed here.'),
  /*
    The division of labour: the super administrator creates administrators, and
    administrators create teachers and students. So the one role the super administrator
    may create is `admin` - anything else is somebody else's to make.
  */
  SUPER_ADMIN_CREATES_ADMINS_ONLY: createErrorDefinition(31006, 'The super administrator can only create administrator accounts.'),
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
    account how to get in - rather than telling a stranger which addresses exist.
  */
  SIGN_IN_WITH_LOGIN_ID: createErrorDefinition(51006, 'Sign in with your login ID rather than your email address.'),
  /*
    Raised only after the account was found and the current password was checked, so it
    tells the owner their entry was wrong rather than telling a stranger the account exists.
    The change-password screen is reachable only with a live session, so there is no
    enumeration to protect against here in the first place.
  */
  CURRENT_PASSWORD_INCORRECT: createErrorDefinition(51007, 'Your current password is incorrect.'),
} as const;
