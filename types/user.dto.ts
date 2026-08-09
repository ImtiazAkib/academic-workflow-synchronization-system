import { toId } from '@/lib/utils';

import { UserRole } from './user-role';

import type { UserEntity } from '@/models/user.model';

/**
 * A user as every screen and API response sees one.
 * Deliberately has no `password` field — see the mapper.
 */
export type UserDto = {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  isApproved: boolean;
  isActive: boolean;
  /**
   * Present for students and teachers once verified, absent for administrators. Safe on
   * the client: it is a username, not a secret — the password is the secret.
   */
  loginId?: string | null;
  emailVerified: boolean;
  /**
   * An address this account has asked to move to and not yet proven. Safe to show: it is
   * the address its owner just typed, and the profile has to say what it is waiting on —
   * otherwise a change that went to a mistyped address is silent.
   */
  pendingEmail?: string | null;
  designation?: string | null;
  roll?: string | null;
  registrationNo?: string | null;
  session?: string | null;
  department?: string | null;
  semester?: number | null;
  phone?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Map a stored user to its DTO.
 *
 * This is the only route a user takes to the UI. Because the mapper names every
 * field explicitly, `password`, `_id` and `__v` cannot leak by being forgotten —
 * a new sensitive column is invisible here until someone deliberately adds it.
 *
 * @param entity - Stored user.
 *
 * @returns Instance of UserDto.
 */
export function userFromEntity(entity: UserEntity): UserDto {
  return {
    userId: toId(entity._id),
    name: entity.name,
    email: entity.email,
    role: entity.role,
    isApproved: entity.isApproved,
    isActive: entity.isActive,
    loginId: entity.loginId ?? null,
    emailVerified: entity.emailVerified,
    pendingEmail: entity.pendingEmail ?? null,
    designation: entity.designation ?? null,
    roll: entity.roll ?? null,
    registrationNo: entity.registrationNo ?? null,
    session: entity.session ?? null,
    department: entity.department ?? null,
    semester: entity.semester ?? null,
    phone: entity.phone ?? null,
    address: entity.address ?? null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
