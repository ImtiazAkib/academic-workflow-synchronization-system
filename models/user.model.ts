import bcrypt from 'bcryptjs';
import mongoose, { Model, Schema, Types } from 'mongoose';

import { UserRole } from '@/types';

/*
  Models import the constant module directly rather than the `@/constants` barrel.
  The barrel re-exports `home.const.ts`, which pulls in `lucide-react` — fine in a
  React tree, dead weight in a seed script and fatal in the middleware bundle.
*/
import { ACCOUNT_FIELD_LIMITS } from '@/constants/account.const';
import { USER_ROLES } from '@/constants/roles.const';
import { SEMESTER } from '@/constants/schedule.const';

const PASSWORD_SALT_ROUNDS = 12;

export type UserAttributes = {
  name: string;
  email: string;
  /**
   * Holds the bcrypt hash at rest. `select: false`, so it is absent unless a query
   * asks for it explicitly with `.select('+password')`.
   */
  password: string;
  role: UserRole;
  isApproved: boolean;
  isActive: boolean;
  /**
   * What the account signs in with — `S-2026-0042`, `T-2026-0007`. Issued when email
   * verification passes, never chosen. Absent on administrators, who sign in with their
   * email address, which is why the unique index on it is partial.
   */
  loginId?: string;
  /**
   * Whether the address has been proven. An account is usable only when this and
   * `isApproved` are both true, and they are different problems with different remedies
   * — "check your inbox" is not "wait for the department".
   */
  emailVerified: boolean;
  /**
   * SHA-256 of the token in the verification link, never the token itself, for the same
   * reason `password` holds a hash: a leaked database read should not hand out accounts.
   * `select: false`, and cleared the moment it is used.
   */
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: Date;
  /**
   * An address somebody has asked to move to, and has not yet proven.
   *
   * Held apart from `email` rather than written over it, because the address on the
   * account is the password-recovery channel. Trusting a new one before it is proven
   * turns a borrowed session into a permanent theft — change the address, ask for a
   * reset, own the account. The old one keeps working, and keeps being the way back in,
   * until the link sent to the new one is clicked.
   *
   * Not unique, unlike `email`. Two people may both ask for the same address; only the
   * one who proves it first gets it, and the loser is refused at that moment rather than
   * at this one — a claim nobody ever confirms should not reserve an address forever.
   */
  pendingEmail?: string;
  /**
   * SHA-256 of the token in the change link, never the token — the same reason
   * `emailVerificationTokenHash` holds a hash. `select: false`, cleared once it is used.
   */
  pendingEmailTokenHash?: string;
  pendingEmailExpiresAt?: Date;
  designation?: string;
  /**
   * The department's own number for a student. Data, not a login — unique among
   * students so two people cannot claim the same one, but the account is opened with
   * `loginId`, which the application controls rather than the applicant.
   */
  roll?: string;
  registrationNo?: string;
  /** The intake a student belongs to, as the department writes it — `2021-22`. */
  session?: string;
  /**
   * Collected from students and teachers because the form should ask. Nothing scopes
   * data by it yet — the proposal is explicit that this is one department.
   */
  department?: string;
  /**
   * Which semester a student is in, 1 through 8. Absent on everyone else — it is what
   * their routine is filtered by, and a teacher does not sit in one.
   */
  semester?: number;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * A stored user as the rest of the app sees it. Structural rather than a Mongoose
 * `HydratedDocument`, so DTO mappers accept both hydrated documents and `.lean()`
 * results without knowing which they were given.
 */
export type UserEntity = UserAttributes & { _id: Types.ObjectId };

type UserMethods = {
  comparePassword(candidate: string): Promise<boolean>;
};

type UserModel = Model<UserAttributes, object, UserMethods>;

const userSchema = new Schema<UserAttributes, UserModel, UserMethods>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255 },
    password: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: Object.values(USER_ROLES) },
    // Accounts are created by an administrator and start unapproved on purpose.
    isApproved: { type: Boolean, required: true, default: false },
    // Deactivate rather than delete, so schedules and materials keep a valid author.
    isActive: { type: Boolean, required: true, default: true },
    loginId: { type: String, trim: true, uppercase: true, maxlength: 20 },
    // Registration proves the address; an account created by an administrator is trusted.
    emailVerified: { type: Boolean, required: true, default: false },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpiresAt: { type: Date },
    // Deliberately not unique — see the note on the attribute.
    pendingEmail: { type: String, lowercase: true, trim: true, maxlength: 255 },
    pendingEmailTokenHash: { type: String, select: false },
    pendingEmailExpiresAt: { type: Date },
    designation: { type: String, trim: true, maxlength: 120 },
    roll: { type: String, trim: true, maxlength: ACCOUNT_FIELD_LIMITS.ROLL },
    registrationNo: { type: String, trim: true, maxlength: ACCOUNT_FIELD_LIMITS.REGISTRATION_NO },
    session: { type: String, trim: true, maxlength: ACCOUNT_FIELD_LIMITS.SESSION },
    department: { type: String, trim: true, maxlength: ACCOUNT_FIELD_LIMITS.DEPARTMENT },
    // Bounded here as well as in the schema: the seed script writes straight to the model.
    semester: { type: Number, min: SEMESTER.MIN, max: SEMESTER.MAX },
    phone: { type: String, trim: true, maxlength: 40 },
    address: { type: String, trim: true, maxlength: ACCOUNT_FIELD_LIMITS.ADDRESS },
  },
  { timestamps: true }
);

/*
  Hashing lives here, not in an action or a route handler. Any code path that saves a
  user gets it — including the seed script — and no caller can forget.
*/
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, PASSWORD_SALT_ROUNDS);
});

userSchema.method('comparePassword', async function comparePassword(candidate: string) {
  return bcrypt.compare(candidate, this.password);
});

/*
  There is exactly one super administrator, and this is what makes that true rather than
  merely intended. A partial unique index applies the constraint only to rows carrying
  that role, so the three administrators and every teacher and student are untouched —
  but a second super administrator cannot be written by a service, a seed script, or
  somebody at a Mongo shell. A check in `UserService` is a rule the next caller can
  forget; an index is not.
*/
userSchema.index({ role: 1 }, { unique: true, partialFilterExpression: { role: USER_ROLES.SUPER_ADMIN } });

/*
  The identifier people sign in with, so two accounts sharing one would be two people
  behind one login. Partial rather than sparse-unique because administrators never hold
  one at all: the constraint applies to rows that actually have the field, and ignores
  the rest.

  It is also what makes the generator safe. The sequence comes from a count and the
  write is a separate round trip, so two registrations verifying in the same instant can
  pick the same number — this index refuses the loser, and the generator tries again.
*/
userSchema.index({ loginId: 1 }, { unique: true, partialFilterExpression: { loginId: { $type: 'string' } } });

/*
  A roll number identifies a student to the department, so two students cannot claim the
  same one. Scoped to students: it is meaningless on a teacher, and a partial index
  leaves those rows alone rather than colliding them all on "absent".
*/
userSchema.index({ roll: 1 }, { unique: true, partialFilterExpression: { role: USER_ROLES.STUDENT, roll: { $type: 'string' } } });

// Guarded so hot reload re-uses the compiled model instead of redefining it.
export const User = (mongoose.models.User as UserModel) ?? mongoose.model<UserAttributes, UserModel>('User', userSchema);
