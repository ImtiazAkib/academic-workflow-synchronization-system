import { User } from '@/models/user.model';
import { SessionUser, UserDto, UserFilters, UserRole, userFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';
import { ADMIN_LIMIT, USER_ROLES } from '@/constants/roles.const';
import { FILTER_ALL, USER_STATUS_FILTERS } from '@/constants/users.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import { ListResult, SingleResult, createError, listFailure, listSuccess, singleFailure, singleSuccess } from '@/lib/result';
import type { UserActivateOutput, UserApproveOutput, UserCreateOutput, UserUpdateOutput } from '@/lib/schemas';
import { escapeRegExp, isIssuableRole, toId } from '@/lib/utils';

import { issueLoginId } from './login-id.issuer';

import type { UserAttributes, UserEntity } from '@/models/user.model';
// Mongoose 9 renamed `FilterQuery` to `QueryFilter`. `UpdateQuery` kept its name.
import type { QueryFilter, UpdateQuery } from 'mongoose';

const log = createLoggerWithContext('user.service');

const DATABASE = CODES.DATABASE.USERS;
const VALIDATION = CODES.VALIDATION.USERS;
const BUSINESS = CODES.BUSINESS.USERS;
const AUTH = CODES.AUTH.USERS;

/*
  Who may do what to whom, in one place, because the answer is the same whichever verb
  is being used:

  - The super administrator row is untouchable. Not by an administrator, not by another
    super administrator (there is only one), not by itself. It is seeded and it stays.
  - An `admin` row belongs to the super administrator alone — creating one, promoting
    into the role, demoting out of it, approving, revoking, activating, deactivating.
    Create and promote are the same decision wearing different verbs, so they are one
    rule rather than a list.
  - Nobody changes their own role or their own access. Written about the actor rather
    than the role, so it keeps holding when the role rules next change.
  - At most three active administrators, counted over the `admin` role alone.

  Every one of these is checked here and not in the action, because a Server Action is a
  public endpoint and the screen that hid the button proves nothing about the caller.
*/
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
   * @param requester - The signed-in account making the request.
   *
   * @returns The created account, or a failure naming the field that refused it.
   */
  public async create(input: UserCreateOutput, requester: SessionUser): Promise<SingleResult<UserDto>> {
    try {
      await connectToDatabase();

      const refusal = await this.refuseDisallowedRoleChange(null, input.role, requester);

      if (refusal) {
        return refusal;
      }

      const existing = await User.findOne({ email: input.email }).lean<UserEntity | null>();

      if (existing) {
        return singleFailure(createError(VALIDATION.EMAIL_ALREADY_USED.CODE, VALIDATION.EMAIL_ALREADY_USED.MESSAGE, 'email'));
      }

      /*
        An administrator vouching for somebody is the verification — there is no address
        to prove when the account is being made by the department itself. Marking it
        verified matters twice over: an unverified account cannot sign in at all, and the
        pending queue deliberately hides unverified rows, so leaving it false would
        create an account nobody could use and nobody would see waiting.
      */
      const loginId = isIssuableRole(input.role) ? await issueLoginId(input.role) : null;

      if (isIssuableRole(input.role) && !loginId) {
        return singleFailure(createError(BUSINESS.LOGIN_ID_NOT_ISSUED.CODE, BUSINESS.LOGIN_ID_NOT_ISSUED.MESSAGE));
      }

      const created = await User.create({
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role,
        loginId: loginId ?? undefined,
        emailVerified: true,
        designation: this.optionalText(input.designation),
        roll: this.optionalText(input.roll),
        registrationNo: this.optionalText(input.registrationNo),
        session: this.optionalText(input.session),
        department: this.optionalText(input.department),
        semester: this.semesterFor(input.role, input.semester),
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
   * @param requester - The signed-in account making the request.
   *
   * @returns The updated account, or a failure.
   */
  public async update(input: UserUpdateOutput, requester: SessionUser): Promise<SingleResult<UserDto>> {
    try {
      await connectToDatabase();

      const target = await User.findById(input.userId).lean<UserEntity | null>();

      if (!target) {
        return this.userNotFound();
      }

      const refusal = await this.refuseDisallowedRoleChange(target, input.role, requester);

      if (refusal) {
        return refusal;
      }

      const updated = await User.findByIdAndUpdate(
        input.userId,
        this.toUpdateDocument({
          name: input.name,
          role: input.role,
          designation: this.optionalText(input.designation),
          roll: this.optionalText(input.roll),
          registrationNo: this.optionalText(input.registrationNo),
          session: this.optionalText(input.session),
          department: this.optionalText(input.department),
          semester: this.semesterFor(input.role, input.semester),
          phone: this.optionalText(input.phone),
        }),
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
   * @param requester - The signed-in account making the request.
   *
   * @returns The updated account, or a failure.
   */
  public async setApproval(input: UserApproveOutput, requester: SessionUser): Promise<SingleResult<UserDto>> {
    return this.applyStateChange(input.userId, { isApproved: input.isApproved }, requester);
  }

  /**
   * Switch an account on or off.
   *
   * Deactivation rather than deletion, so schedules and materials keep a valid author.
   *
   * Reactivating counts against the administrator ceiling: three active administrators
   * is the rule, and a fourth arriving through the back door is still a fourth.
   *
   * @param input - Validated activation input.
   * @param requester - The signed-in account making the request.
   *
   * @returns The updated account, or a failure.
   */
  public async setActive(input: UserActivateOutput, requester: SessionUser): Promise<SingleResult<UserDto>> {
    return this.applyStateChange(input.userId, { isActive: input.isActive }, requester);
  }

  /**
   * Apply an approval or activation change, after checking the requester is allowed to
   * make it against this particular account.
   *
   * Both flags go through here because both answer the same question — may this account
   * sign in — so both are governed by the same rules.
   *
   * @param userId - Account being changed.
   * @param change - The single flag to write.
   * @param requester - The signed-in account making the request.
   *
   * @returns The updated account, or a failure.
   */
  private async applyStateChange(
    userId: string,
    change: Partial<Pick<UserAttributes, 'isApproved' | 'isActive'>>,
    requester: SessionUser
  ): Promise<SingleResult<UserDto>> {
    try {
      await connectToDatabase();

      const target = await User.findById(userId).lean<UserEntity | null>();

      if (!target) {
        return this.userNotFound();
      }

      // The role is not changing here, so the target's own role is both sides of the check.
      const refusal = await this.refuseDisallowedRoleChange(target, target.role, requester);

      if (refusal) {
        return refusal;
      }

      /*
        The access half of "nobody changes their own role or access". Approval and
        activation carry no role for the shared gate to compare, so the self-check is
        made here — and it is unconditional, because both flags decide whether this
        account can sign in tomorrow.
      */
      if (toId(target._id) === requester.userId) {
        return this.ownAccess();
      }

      /*
        Switching an administrator back on is the same act as creating one, as far as the
        ceiling is concerned — the department ends up with a fourth either way.
      */
      if (change.isActive === true && target.role === USER_ROLES.ADMIN && (await this.isAdminCeilingReached(userId))) {
        return this.adminLimitReached();
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

    /*
      Waiting for approval means waiting for a *person*, so an application whose address
      has not been proven does not belong in the queue — an administrator should not
      spend attention on somebody who may never come back and confirm. Unverified rows
      are still visible under "all"; they are just not presented as work.

      Accounts an administrator created carry `emailVerified: true` from the start, so
      this narrows the self-registered ones only.
    */
    if (filters.status === USER_STATUS_FILTERS.PENDING) {
      conditions.isApproved = false;
      conditions.isActive = true;
      conditions.emailVerified = true;
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
   * The one gate every mutating method goes through.
   *
   * Takes the account as it stands and the role it is heading for, so create, edit,
   * promote, demote, approve, revoke, activate and deactivate all ask the same question
   * — and cannot answer it differently. A create passes `null` for the target; a state
   * change passes the target's own role on both sides, because nothing is moving.
   *
   * @param target - The account being changed, or null when one is being created.
   * @param nextRole - The role it will hold afterwards.
   * @param requester - The signed-in account making the request.
   *
   * @returns A failure to return, or null when the request is allowed.
   */
  private async refuseDisallowedRoleChange(
    target: UserEntity | null,
    nextRole: UserRole,
    requester: SessionUser
  ): Promise<SingleResult<UserDto> | null> {
    const isSuperAdmin = requester.role === USER_ROLES.SUPER_ADMIN;

    // Nothing reaches the seeded account, and nothing is ever promoted into its role.
    if (target?.role === USER_ROLES.SUPER_ADMIN || nextRole === USER_ROLES.SUPER_ADMIN) {
      return singleFailure(createError(BUSINESS.SUPER_ADMIN_IS_IMMUTABLE.CODE, BUSINESS.SUPER_ADMIN_IS_IMMUTABLE.MESSAGE));
    }

    /*
      An administrator account is the super administrator's alone, whether it is being
      made, unmade, or merely switched off. Both sides are checked: leaving the role is
      as much an administrator decision as entering it.
    */
    if (!isSuperAdmin && (target?.role === USER_ROLES.ADMIN || nextRole === USER_ROLES.ADMIN)) {
      return singleFailure(createError(AUTH.ADMIN_MANAGED_BY_SUPER_ADMIN.CODE, AUTH.ADMIN_MANAGED_BY_SUPER_ADMIN.MESSAGE));
    }

    /*
      Nobody moves their own role. Deliberately narrow: editing your own name or phone
      through this screen is fine, and demoting yourself is not. The access half of the
      same rule lives in `applyStateChange`, because approval and activation carry no
      role to compare.
    */
    if (target && toId(target._id) === requester.userId && nextRole !== target.role) {
      return this.ownAccess();
    }

    // Only a move *into* the role can push the count up; staying put cannot.
    if (nextRole === USER_ROLES.ADMIN && target?.role !== USER_ROLES.ADMIN && (await this.isAdminCeilingReached(null))) {
      return this.adminLimitReached();
    }

    return null;
  }

  /**
   * Whether the department already has as many active administrators as it may have.
   *
   * Counted over the `admin` role alone — the super administrator is not one of the
   * three. Deactivated administrators are not counted, so switching one off frees the
   * seat for a replacement; otherwise a department that loses someone could never fill
   * the gap, because accounts are deactivated rather than deleted.
   *
   * @param excludeUserId - An account to leave out of the count, or null.
   *
   * @returns True when no further administrator may be activated.
   */
  private async isAdminCeilingReached(excludeUserId: string | null): Promise<boolean> {
    const conditions: QueryFilter<UserAttributes> = { role: USER_ROLES.ADMIN, isActive: true };

    if (excludeUserId) {
      conditions._id = { $ne: excludeUserId };
    }

    return (await User.countDocuments(conditions)) >= ADMIN_LIMIT;
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

  /**
   * A semester belongs to a student and to nobody else.
   *
   * Dropped rather than stored for the other two roles, so promoting a student to a
   * teacher cannot leave a year behind on the record — invisible on every screen, and
   * still there for anything that later reads the field.
   *
   * @param role - The role being saved.
   * @param semester - Semester from the form, already validated.
   *
   * @returns The semester to store, or undefined.
   */
  private semesterFor(role: UserRole, semester: number | undefined): number | undefined {
    return role === USER_ROLES.STUDENT ? semester : undefined;
  }

  /**
   * Turn a set of field values into the update Mongo actually applies.
   *
   * Mongoose drops `undefined` keys from an update rather than clearing the field, so
   * emptying an optional input would otherwise be a silent no-op: the form would say
   * the designation was gone while the record still held it. Present values are
   * written with `$set`, absent ones removed with `$unset`.
   *
   * @param fields - The values the form produced, `undefined` meaning "no longer set".
   *
   * @returns An update document that both writes and clears.
   */
  private toUpdateDocument(fields: Record<string, unknown>): UpdateQuery<UserAttributes> {
    const assigned: Record<string, unknown> = {};
    const cleared: Record<string, ''> = {};

    Object.entries(fields).forEach(([field, value]) => {
      if (value === undefined) {
        cleared[field] = '';

        return;
      }

      assigned[field] = value;
    });

    // An empty `$unset` is rejected by the driver, so it is only included when it has work.
    return Object.keys(cleared).length > 0 ? { $set: assigned, $unset: cleared } : { $set: assigned };
  }

  private userNotFound(): SingleResult<UserDto> {
    return singleFailure(createError(VALIDATION.USER_NOT_FOUND.CODE, VALIDATION.USER_NOT_FOUND.MESSAGE));
  }

  private ownAccess(): SingleResult<UserDto> {
    return singleFailure(createError(BUSINESS.CANNOT_CHANGE_OWN_ACCESS.CODE, BUSINESS.CANNOT_CHANGE_OWN_ACCESS.MESSAGE));
  }

  private adminLimitReached(): SingleResult<UserDto> {
    return singleFailure(createError(BUSINESS.ADMIN_LIMIT_REACHED.CODE, BUSINESS.ADMIN_LIMIT_REACHED.MESSAGE, 'role'));
  }
}
