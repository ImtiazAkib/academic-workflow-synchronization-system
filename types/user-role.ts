/**
 * Every role an account can hold.
 *
 * `super-admin` is not a bigger administrator — it is the one account the application
 * itself cannot change, and the only one allowed to manage the others. There is exactly
 * one, pinned by a partial unique index on the model and seeded rather than created.
 */
export type UserRole = 'super-admin' | 'admin' | 'teacher' | 'student';
