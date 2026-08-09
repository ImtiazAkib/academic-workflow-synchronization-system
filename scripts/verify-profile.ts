import mongoose from 'mongoose';

import { User } from '@/models/user.model';

import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import { ProfileUpdateSchema } from '@/lib/schemas';
import { AuthService, UserService, hashToken } from '@/lib/services';

import type { SessionUser } from '@/types';

/*
  Exercises the profile: what an account holder may change about themselves, what the
  schema silently refuses to carry, and the address change that does not take effect until
  a link is followed.

  The last of those is the reason this file exists. It is the one path in the step a
  browser cannot check — the link arrives in an inbox — and it is also the one where being
  wrong is a security bug rather than a cosmetic one.

  Every row it writes carries the `profile-verify` email prefix and is deleted afterwards.

  Run with `npm run verify:profile`.
*/
const TEMP = 'profile-verify';
const PASSWORD = 'temp-password-123';

const VALIDATION = CODES.VALIDATION.USERS;

const users = new UserService();
const auth = new AuthService();

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail = ''): void {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}`);
    return;
  }

  failed++;
  console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
}

function address(name: string): string {
  return `${TEMP}-${name}@department.edu`;
}

/**
 * Create a student to edit, already verified and approved so it looks like an account
 * somebody is actually signed in to.
 *
 * @param name - Distinguishes this row's address and roll from the others.
 *
 * @returns The requester a Server Action would have built from the session cookie.
 */
async function seedStudent(name: string): Promise<SessionUser> {
  const created = await User.create({
    name: 'Verify Student',
    email: address(name),
    password: PASSWORD,
    role: USER_ROLES.STUDENT,
    loginId: `S-2026-9${String(Math.abs(name.length) % 10)}${String(name.charCodeAt(0) % 100).padStart(2, '0')}`,
    emailVerified: true,
    isApproved: true,
    isActive: true,
    roll: `${TEMP}-${name}`,
    registrationNo: 'REG-9001',
    session: '2021-22',
    department: 'Computer Science',
    semester: 7,
  });

  return {
    userId: String(created._id),
    email: created.email,
    name: created.name,
    role: USER_ROLES.STUDENT,
    isApproved: true,
  };
}

async function cleanup(): Promise<void> {
  await User.deleteMany({ email: { $regex: `^${TEMP}` } });
  await User.deleteMany({ pendingEmail: { $regex: `^${TEMP}` } });
}

async function run(): Promise<void> {
  await connectToDatabase();
  await User.init();
  await cleanup();

  console.log('\n1. the fields somebody owns');

  const owner = await seedStudent('owner');

  const saved = await users.updateOwnProfile(
    ProfileUpdateSchema.parse({ name: 'Corrected Name', email: owner.email, phone: '+8801711000000', address: '12 Station Road, Rajshahi' }),
    owner
  );

  check('a profile saves', saved.success && saved.result !== null, JSON.stringify(saved.errors));
  check('the name is written', saved.result?.user.name === 'Corrected Name');
  check('the phone is written', saved.result?.user.phone === '+8801711000000');
  check('the address is written', saved.result?.user.address === '12 Station Road, Rajshahi');
  check('and no address change was started', saved.result?.pendingEmailToken === null);

  /*
    Emptying an optional field has to clear it rather than be ignored. Mongoose drops
    `undefined` keys from an update, so without the `$unset` half of `toUpdateDocument`
    the form would report the phone number gone while the record still held it.
  */
  const cleared = await users.updateOwnProfile(
    ProfileUpdateSchema.parse({ name: 'Corrected Name', email: owner.email, phone: '', address: '' }),
    owner
  );

  check('clearing the phone clears it', cleared.result?.user.phone === null, String(cleared.result?.user.phone));
  check('clearing the address clears it', cleared.result?.user.address === null, String(cleared.result?.user.address));

  console.log('\n2. what the schema will not carry');

  /*
    The point of the schema having no such fields. A hand-built request naming them is not
    refused with an error — it parses, and they are simply gone by the time a service sees
    it. Anything else would be a privilege escalation with a form around it.
  */
  const escalation = ProfileUpdateSchema.parse({
    name: 'Corrected Name',
    email: owner.email,
    phone: '',
    address: '',
    role: USER_ROLES.SUPER_ADMIN,
    isApproved: true,
    roll: 'stolen-roll',
    semester: 1,
    department: 'Somewhere Else',
    userId: '000000000000000000000000',
  } as never);

  check('role is dropped by the schema', !('role' in escalation), JSON.stringify(escalation));
  check('isApproved is dropped', !('isApproved' in escalation));
  check('roll is dropped', !('roll' in escalation));
  check('semester is dropped', !('semester' in escalation));
  check('department is dropped', !('department' in escalation));
  check('userId is dropped, so the account is the session s', !('userId' in escalation));

  await users.updateOwnProfile(escalation, owner);

  const untouched = await User.findById(owner.userId).lean();

  check('the role did not move', untouched?.role === USER_ROLES.STUDENT, String(untouched?.role));
  check('the roll did not move', untouched?.roll === `${TEMP}-owner`, String(untouched?.roll));
  check('the semester did not move', untouched?.semester === 7, String(untouched?.semester));
  check('the department did not move', untouched?.department === 'Computer Science', String(untouched?.department));

  console.log('\n3. an address change waits for the link');

  const mover = await seedStudent('mover');
  const nextAddress = address('mover-new');

  const requested = await users.updateOwnProfile(
    ProfileUpdateSchema.parse({ name: 'Verify Student', email: nextAddress, phone: '', address: '' }),
    mover
  );

  check('the change is accepted', requested.success, JSON.stringify(requested.errors));
  check('a token comes back to mail', Boolean(requested.result?.pendingEmailToken));
  check('the account keeps its old address', requested.result?.user.email === mover.email, String(requested.result?.user.email));
  check('the new one is held as pending', requested.result?.user.pendingEmail === nextAddress);

  const storedChange = await User.findById(mover.userId).select('+pendingEmailTokenHash').lean();

  check('only a hash of the token is stored', storedChange?.pendingEmailTokenHash !== requested.result?.pendingEmailToken);
  check('and it is that token s hash', storedChange?.pendingEmailTokenHash === hashToken(requested.result?.pendingEmailToken ?? ''));
  check('the change expires', storedChange?.pendingEmailExpiresAt instanceof Date);

  /*
    The whole point of the step: the account's identity has not moved while the change is
    pending. If this ever fails, an unproven address has become the way into an account.

    Checked through both credential shapes, because the risk is not the same in each. A
    student signs in with an issued identifier, so the address is only what password
    recovery would be sent to; an administrator signs in with the address itself, where an
    unproven change would hand over the account outright.
  */
  const stillTheirs = await auth.verifyCredentials(storedChange?.loginId ?? '', PASSWORD);

  check('a student still signs in, by identifier', stillTheirs.success, JSON.stringify(stillTheirs.errors));
  check('and the account still answers with the old address', stillTheirs.result?.email === mover.email, String(stillTheirs.result?.email));

  const newDoesNotWork = await auth.verifyCredentials(nextAddress, PASSWORD);

  check('the new address opens nothing', !newDoesNotWork.success);

  /*
    Created straight on the model rather than through `UserService`, which would refuse a
    fourth administrator. The ceiling is not what is under test here, and the row is gone
    by the end of the run.
  */
  const adminRow = await User.create({
    name: 'Verify Admin',
    email: address('admin'),
    password: PASSWORD,
    role: USER_ROLES.ADMIN,
    emailVerified: true,
    isApproved: true,
    isActive: true,
  });

  const adminMover: SessionUser = {
    userId: String(adminRow._id),
    email: adminRow.email,
    name: adminRow.name,
    role: USER_ROLES.ADMIN,
    isApproved: true,
  };

  await users.updateOwnProfile(ProfileUpdateSchema.parse({ name: 'Verify Admin', email: address('admin-new'), phone: '', address: '' }), adminMover);

  const adminOldAddress = await auth.verifyCredentials(adminMover.email, PASSWORD);

  check('an administrator still signs in with the old address', adminOldAddress.success, JSON.stringify(adminOldAddress.errors));

  const adminNewAddress = await auth.verifyCredentials(address('admin-new'), PASSWORD);

  check('and the unproven one is not a way in', !adminNewAddress.success);

  console.log('\n4. following the link');

  const confirmed = await auth.confirmEmailChange(requested.result?.pendingEmailToken ?? '');

  check('the change applies', confirmed.success, JSON.stringify(confirmed.errors));
  check('the account is on the new address', confirmed.result?.email === nextAddress, String(confirmed.result?.email));
  check('the pending address is gone', confirmed.result?.pendingEmail === null);

  const spent = await User.findById(mover.userId).select('+pendingEmailTokenHash').lean();

  check('the token is cleared', !spent?.pendingEmailTokenHash);
  check('the account is still verified', spent?.emailVerified === true);
  check('and still holds its identifier', Boolean(spent?.loginId));

  const replay = await auth.confirmEmailChange(requested.result?.pendingEmailToken ?? '');

  check('following the link twice is refused', !replay.success);
  check('and reported as an invalid link', replay.errors[0]?.code === VALIDATION.VERIFICATION_LINK_INVALID.CODE, JSON.stringify(replay.errors));

  console.log('\n5. what the link refuses');

  const expirer = await seedStudent('expirer');
  const expiringRequest = await users.updateOwnProfile(
    ProfileUpdateSchema.parse({ name: 'Verify Student', email: address('expirer-new'), phone: '', address: '' }),
    expirer
  );

  await User.findByIdAndUpdate(expirer.userId, { pendingEmailExpiresAt: new Date(Date.now() - 1000) });

  const expired = await auth.confirmEmailChange(expiringRequest.result?.pendingEmailToken ?? '');

  check('an expired link is refused', !expired.success);
  check('and says so, rather than "invalid"', expired.errors[0]?.code === VALIDATION.VERIFICATION_LINK_EXPIRED.CODE, JSON.stringify(expired.errors));

  const unknown = await auth.confirmEmailChange('not-a-real-token');

  check('a token nobody minted is refused', !unknown.success);

  console.log('\n6. two people, one address');

  const racer = await seedStudent('racer');
  const contested = address('contested');

  const racerRequest = await users.updateOwnProfile(
    ProfileUpdateSchema.parse({ name: 'Verify Student', email: contested, phone: '', address: '' }),
    racer
  );

  check('an unclaimed address may be asked for', racerRequest.success, JSON.stringify(racerRequest.errors));

  // Somebody else registers it in the window between the request and the click.
  await User.create({
    name: 'Verify Rival',
    email: contested,
    password: PASSWORD,
    role: USER_ROLES.TEACHER,
    emailVerified: true,
    isApproved: true,
    isActive: true,
  });

  const lostRace = await auth.confirmEmailChange(racerRequest.result?.pendingEmailToken ?? '');

  check('the loser is refused at the link', !lostRace.success);
  check('and told the address is taken', lostRace.errors[0]?.code === VALIDATION.EMAIL_ALREADY_USED.CODE, JSON.stringify(lostRace.errors));

  const survivor = await User.findById(racer.userId).lean();

  check('their account keeps its own address', survivor?.email === racer.email, String(survivor?.email));

  const alreadyTaken = await users.updateOwnProfile(
    ProfileUpdateSchema.parse({ name: 'Verify Student', email: contested, phone: '', address: '' }),
    racer
  );

  check('asking for a registered address is refused up front', !alreadyTaken.success);
  check('naming the email field', alreadyTaken.errors[0]?.field === 'email', JSON.stringify(alreadyTaken.errors));

  console.log('\n7. taking a change back');

  const canceller = await seedStudent('canceller');

  await users.updateOwnProfile(
    ProfileUpdateSchema.parse({ name: 'Verify Student', email: address('typo-nobody-owns'), phone: '', address: '' }),
    canceller
  );

  const cancelled = await users.updateOwnProfile(
    ProfileUpdateSchema.parse({ name: 'Verify Student', email: canceller.email, phone: '', address: '' }),
    canceller
  );

  check(
    're-submitting the current address clears the pending one',
    cancelled.result?.user.pendingEmail === null,
    String(cancelled.result?.user.pendingEmail)
  );
  check('and mints no new token', cancelled.result?.pendingEmailToken === null);

  const cancelledRow = await User.findById(canceller.userId).select('+pendingEmailTokenHash').lean();

  check('the old link stops working', !cancelledRow?.pendingEmailTokenHash);

  console.log('\n8. an account that is no longer there');

  const ghost: SessionUser = { ...owner, userId: '000000000000000000000000' };
  const missing = await users.updateOwnProfile(ProfileUpdateSchema.parse({ name: 'Nobody', email: address('ghost'), phone: '', address: '' }), ghost);

  check('a session naming a deleted row is refused', !missing.success);
  check('as "user not found"', missing.errors[0]?.code === VALIDATION.USER_NOT_FOUND.CODE, JSON.stringify(missing.errors));

  await cleanup();
  console.log('\ncleaned up.');
  console.log(`\npassed ${passed}, failed ${failed}`);

  await mongoose.disconnect();
  process.exitCode = failed > 0 ? 1 : 0;
}

run().catch(async error => {
  console.error('verification failed:', error instanceof Error ? error.message : error);
  await cleanup().catch(() => undefined);
  await mongoose.disconnect();
  process.exitCode = 1;
});
