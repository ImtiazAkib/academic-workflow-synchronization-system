import { User } from '@/models/user.model';
import { UserDto, userFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import { createError, SingleResult, singleFailure, singleSuccess } from '@/lib/result';

const log = createLoggerWithContext('auth.service');

const AUTH = CODES.AUTH.USERS;

export class AuthService {
  /**
   * Check an email and password, and report why they were refused.
   *
   * The order matters: the password is verified first, so account state — waiting for
   * approval, deactivated — is only ever disclosed to someone who already proved they
   * own the account.
   *
   * @param email - Email address as typed.
   * @param password - Password as typed.
   *
   * @returns The user on success, or a failure carrying the reason.
   */
  public async verifyCredentials(email: string, password: string): Promise<SingleResult<UserDto>> {
    try {
      await connectToDatabase();

      const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

      if (!user) {
        return this.invalidCredentials();
      }

      const matches = await user.comparePassword(password);

      if (!matches) {
        return this.invalidCredentials();
      }

      if (!user.isActive) {
        return singleFailure(createError(AUTH.ACCOUNT_DEACTIVATED.CODE, AUTH.ACCOUNT_DEACTIVATED.MESSAGE));
      }

      if (!user.isApproved) {
        return singleFailure(createError(AUTH.ACCOUNT_NOT_APPROVED.CODE, AUTH.ACCOUNT_NOT_APPROVED.MESSAGE));
      }

      return singleSuccess(userFromEntity(user));
    } catch (error) {
      log.error({ err: error }, 'Credential verification failed');
      return singleFailure(createError(AUTH.SIGN_IN_FAILED.CODE, AUTH.SIGN_IN_FAILED.MESSAGE));
    }
  }

  /**
   * One shared failure for an unknown email and a wrong password. Distinguishing them
   * would let anyone probe which addresses have accounts here.
   */
  private invalidCredentials(): SingleResult<UserDto> {
    return singleFailure(createError(AUTH.INVALID_CREDENTIALS.CODE, AUTH.INVALID_CREDENTIALS.MESSAGE));
  }
}
