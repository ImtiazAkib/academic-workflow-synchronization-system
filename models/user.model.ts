import bcrypt from 'bcryptjs';
import mongoose, { Model, Schema, Types } from 'mongoose';

import { UserRole } from '@/types';

/*
  Models import the constant module directly rather than the `@/constants` barrel.
  The barrel re-exports `home.const.ts`, which pulls in `lucide-react` — fine in a
  React tree, dead weight in a seed script and fatal in the middleware bundle.
*/
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
  designation?: string;
  studentId?: string;
  /**
   * Which semester a student is in, 1 through 8. Absent on everyone else — it is what
   * their routine is filtered by, and a teacher does not sit in one.
   */
  semester?: number;
  phone?: string;
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
    designation: { type: String, trim: true, maxlength: 120 },
    studentId: { type: String, trim: true, maxlength: 40 },
    // Bounded here as well as in the schema: the seed script writes straight to the model.
    semester: { type: Number, min: SEMESTER.MIN, max: SEMESTER.MAX },
    phone: { type: String, trim: true, maxlength: 40 },
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

// Guarded so hot reload re-uses the compiled model instead of redefining it.
export const User = (mongoose.models.User as UserModel) ?? mongoose.model<UserAttributes, UserModel>('User', userSchema);
