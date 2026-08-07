import { User } from '@/models/user.model';

import { LOGIN_ID } from '@/constants/account.const';

import { createLoggerWithContext } from '@/lib/logger';
import { formatLoginId } from '@/lib/utils';
import type { IssuableRole } from '@/lib/utils';

const log = createLoggerWithContext('login-id.issuer');

/**
 * Mint the next login identifier for a role.
 *
 * Shared by both paths that can create an account that needs one — self-registration,
 * where it is issued the moment the address is proven, and an administrator creating an
 * account, where the administrator vouching for the person is the proof. One generator,
 * so the two cannot drift into producing different shapes or colliding sequences.
 *
 * The sequence comes from a count and the write is a separate round trip, so two
 * accounts created in the same instant can pick the same number. The partial unique
 * index on `loginId` refuses the loser rather than letting two people share a login, and
 * this walks forward to the next free number instead.
 *
 * @param role - Student or teacher; administrators are issued nothing.
 *
 * @returns The identifier, or null when none could be found.
 */
export async function issueLoginId(role: IssuableRole): Promise<string | null> {
  const year = new Date().getFullYear();
  const issued = await User.countDocuments({ role, loginId: { $exists: true } });

  for (let attempt = 0; attempt < LOGIN_ID.MAX_ATTEMPTS; attempt++) {
    const candidate = formatLoginId(role, year, issued + 1 + attempt);
    const taken = await User.exists({ loginId: candidate });

    if (!taken) {
      return candidate;
    }
  }

  log.error({ role, year }, 'Could not find a free login ID after every attempt');

  return null;
}
