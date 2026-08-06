import { User } from '@/models/user.model';
import { UserDto, UserFilters, userFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';
import { FILTER_ALL, USER_STATUS_FILTERS } from '@/constants/users.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import { ListResult, SingleResult, createError, listFailure, listSuccess, singleFailure, singleSuccess } from '@/lib/result';
import type { UserActivateOutput, UserApproveOutput, UserCreateOutput, UserUpdateOutput } from '@/lib/schemas';
import { escapeRegExp } from '@/lib/utils';

import type { UserAttributes, UserEntity } from '@/models/user.model';
// Mongoose 9 renamed `FilterQuery` to `QueryFilter`.
import type { QueryFilter } from 'mongoose';

const log = createLoggerWithContext('user.service');

const DATABASE = CODES.DATABASE.USERS;
const VALIDATION = CODES.VALIDATION.USERS;
const BUSINESS = CODES.BUSINESS.USERS;

export class UserService {
  /**
   * List the department's accounts, newest first, narrowed by the screen's filters.
   *
   * @param filters - Role, status and search text, already validated.
   *
   * @returns Every matching account as a DTO.
   */
  public async list(filters: UserFilters): Promise<ListResult<UserDto>> {
    try {
      await connectToDatabase();

      const users = await User.find(this.buildConditions(filters)).sort({ createdAt: -1 }).lean<UserEntity[]>();

      return listSuccess(users.map(userFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing users failed');

      return listFailure(createError(DATABASE.LIST_FAILED.CODE, DATABASE.LIST_FAILED.MESSAGE));
    }
  }

  /**
   * Create an account.
   *
   * The password arrives in plaintext and is handed to the model as-is: hashing lives
   * in the pre-save hook, so this method cannot forget it. The account starts
   * unapproved, which is the model's default — approval is a deliberate second act.
   *
   * @param input - Validated create input.
   *
   * @returns The created account, or a failure naming the field that refused it.
   */
  public async create(input: UserCreateOutput): Promise<SingleResult<UserDto>> {
    try {
      await connectToDatabase();

      const existing = await User.findOne({ email: input.email }).lean<UserEntity | null>();

      if (existing) {
        return singleFailure(createError(VALIDATION.EMAIL_ALREADY_USED.CODE, VALIDATION.EMAIL_ALREADY_USED.MESSAGE, 'email'));
      }

      const created = await User.create({
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role,
        designation: this.optionalText(input.designation),
        studentId: this.optionalText(input.studentId),
        phone: this.optionalText(input.phone),
      });

      return singleSuccess(userFromEntity(created));
    } catch (error) {
      log.error({ err: error }, 'Creating a user failed');

      return singleFailure(createError(DATABASE.CREATE_FAILED.CODE, DATABASE.CREATE_FAILED.MESSAGE));
    }
  }

  /**
   * Update a profile.
   *
   * Email and password are deliberately absent — an email change moves the account's
   * identity and a password change needs its own confirmation, so neither belongs in
   * the same form as a phone number.
   *
   * @param input - Validated update input.
   *
   * @returns The updated account, or a failure.
   */
  public async update(input: UserUpdateOutput): Promise<SingleResult<UserDto>> {
    try {
      await connectToDatabase();

      const target = await User.findById(input.userId).lean<UserEntity | null>();

      if (!target) {
        return this.userNotFound();
      }

      /*
        Demoting the last administrator locks everyone out of the admin area just as
        surely as deactivating them, so the same guard covers it.
      */
      if (target.role === USER_ROLES.ADMIN && input.role !== USER_ROLES.ADMIN && (await this.isLastUsableAdministrator(input.userId))) {
        return this.lastAdministrator();
      }

      const updated = await User.findByIdAndUpdate(
        input.userId,
        {
          name: input.name,
          role: input.role,
          designation: this.optionalText(input.designation),
          studentId: this.optionalText(input.studentId),
          phone: this.optionalText(input.phone),
        },
        { returnDocument: 'after' }
      ).lean<UserEntity | null>();

      if (!updated) {
        return this.userNotFound();
      }

      return singleSuccess(userFromEntity(updated));
    } catch (error) {
      log.error({ err: error }, 'Updating a user failed');

      return singleFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * Approve an account, or take approval back.
   *
   * @param input - Validated approval input.
   *
   * @returns The updated account, or a failure.
   */
  public async setApproval(input: UserApproveOutput): Promise<SingleResult<UserDto>> {
    return this.applyStateChange(input.userId, { isApproved: input.isApproved }, !input.isApproved);
  }

  /**
   * Switch an account on or off.
   *
   * Deactivation rather than deletion, so schedules and materials keep a valid author.
   *
   * @param input - Validated activation input.
   *
   * @returns The updated account, or a failure.
   */
  public async setActive(input: UserActivateOutput): Promise<SingleResult<UserDto>> {
    return this.applyStateChange(input.userId, { isActive: input.isActive }, !input.isActive);
  }

  /**
   * Apply an approval or activation change, refusing the one that would leave the
   * department with no administrator who can sign in.
   *
   * @param userId - Account being changed.
   * @param change - The single flag to write.
   * @param removesAccess - Whether the change costs this account its access.
   *
   * @returns The updated account, or a failure.
   */
  private async applyStateChange(
    userId: string,
    change: Partial<Pick<UserAttributes, 'isApproved' | 'isActive'>>,
    removesAccess: boolean
  ): Promise<SingleResult<UserDto>> {
    try {
      await connectToDatabase();

      const target = await User.findById(userId).lean<UserEntity | null>();

      if (!target) {
        return this.userNotFound();
      }

      if (removesAccess && target.role === USER_ROLES.ADMIN && (await this.isLastUsableAdministrator(userId))) {
        return this.lastAdministrator();
      }

      const updated = await User.findByIdAndUpdate(userId, change, { returnDocument: 'after' }).lean<UserEntity | null>();

      if (!updated) {
        return this.userNotFound();
      }

      return singleSuccess(userFromEntity(updated));
    } catch (error) {
      log.error({ err: error }, 'Changing a user state failed');

      return singleFailure(createError(DATABASE.UPDATE_FAILED.CODE, DATABASE.UPDATE_FAILED.MESSAGE));
    }
  }

  /**
   * Translate the screen's filters into a Mongo query.
   *
   * The three states partition the table rather than overlapping: an account is
   * waiting for approval, usable, or switched off — never two at once.
   *
   * @param filters - Role, status and search text.
   *
   * @returns Conditions for `User.find()`.
   */
  private buildConditions(filters: UserFilters): QueryFilter<UserAttributes> {
    const conditions: QueryFilter<UserAttributes> = {};

    if (filters.role !== FILTER_ALL) {
      conditions.role = filters.role;
    }

    if (filters.status === USER_STATUS_FILTERS.PENDING) {
      conditions.isApproved = false;
      conditions.isActive = true;
    }

    if (filters.status === USER_STATUS_FILTERS.ACTIVE) {
      conditions.isApproved = true;
      conditions.isActive = true;
    }

    if (filters.status === USER_STATUS_FILTERS.INACTIVE) {
      conditions.isActive = false;
    }

    if (filters.query) {
      // Escaped, because the raw value comes from a search box and a URL.
      const pattern = new RegExp(escapeRegExp(filters.query), 'i');

      conditions.$or = [{ name: pattern }, { email: pattern }];
    }

    return conditions;
  }

  /**
   * Whether this account is the only administrator who can still sign in.
   *
   * @param userId - Account being changed, excluded from the count.
   *
   * @returns True when no other approved, active administrator remains.
   */
  private async isLastUsableAdministrator(userId: string): Promise<boolean> {
    const remaining = await User.countDocuments({
      _id: { $ne: userId },
      role: USER_ROLES.ADMIN,
      isApproved: true,
      isActive: true,
    });

    return remaining === 0;
  }

  /**
   * An untouched optional input submits an empty string. Store nothing instead, so the
   * DTO reports `null` rather than an empty value that reads as deliberate.
   *
   * @param value - Raw optional field.
   *
   * @returns The trimmed text, or undefined when it was blank.
   */
  private optionalText(value: string | undefined): string | undefined {
    return value ? value : undefined;
  }

  private userNotFound(): SingleResult<UserDto> {
    return singleFailure(createError(VALIDATION.USER_NOT_FOUND.CODE, VALIDATION.USER_NOT_FOUND.MESSAGE));
  }

  private lastAdministrator(): SingleResult<UserDto> {
    return singleFailure(createError(BUSINESS.LAST_ADMIN_CANNOT_BE_REMOVED.CODE, BUSINESS.LAST_ADMIN_CANNOT_BE_REMOVED.MESSAGE));
  }
}
