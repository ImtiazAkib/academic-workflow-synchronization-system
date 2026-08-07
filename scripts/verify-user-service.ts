import mongoose from 'mongoose';

import { User } from '@/models/user.model';
import { SessionUser } from '@/types';

import { ADMIN_LIMIT, USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import { UserService } from '@/lib/services/user.service';

/*
  Exercises the UserService paths a browser check cannot reach without signing in: who
  may create an administrator, the ceiling on how many there are, the accounts nobody
  may touch, and the ones nobody may touch on their own behalf.

  Two things keep it safe against a real database. Every row it writes carries the
  `user-verify` email prefix and is deleted afterwards. And the requesters are plain
  `SessionUser` objects rather than real accounts — the service reads a role and an id
  from them, so a super administrator can be simulated without minting one and without
  the real seeded account ever being the actor.

  Where a real row is unavoidable — proving the super administrator account is immutable
  and that the unique index refuses a second one — it uses the seeded one if there is
  one, and only ever as the *target* of a refusal, which by definition does not write.
  On a database with none yet, it mints a throwaway one and deletes it with the rest,
  because skipping the checks this step exists for would be the worse trade.

  Run with `npm run verify:users`.
*/
const TEMP = 'user-verify';

const service = new UserService();

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

/** A signed-in account as the service sees one. No row required. */
function requester(role: SessionUser['role'], userId = String(new mongoose.Types.ObjectId())): SessionUser {
  return { userId, email: `${TEMP}-requester@department.edu`, name: 'Verify Requester', role, isApproved: true };
}

const asSuperAdmin = requester(USER_ROLES.SUPER_ADMIN);
const asAdmin = requester(USER_ROLES.ADMIN);

/** The fields every create needs, so a call site shows only what it is testing. */
function createInput(overrides: { name?: string; email: string; role: SessionUser['role'] }) {
  return {
    name: overrides.name ?? 'Verify Temp',
    email: overrides.email,
    password: 'temp-password-123',
    role: overrides.role,
    designation: '',
    studentId: '',
    semester: undefined,
    phone: '',
  };
}

async function cleanup(): Promise<void> {
  await User.deleteMany({ email: { $regex: `^${TEMP}` } });
}

async function run(): Promise<void> {
  await connectToDatabase();
  // Indexes are built lazily; the unique-index check below needs it to exist first.
  await User.init();
  await cleanup();

  console.log('\n1. ordinary accounts, created by an administrator');
  const created = await service.create(createInput({ email: `${TEMP}-teacher@department.edu`, role: USER_ROLES.TEACHER }), asAdmin);
  check('creates a teacher', created.success && created.result !== null, JSON.stringify(created.errors));
  check('starts unapproved', created.result?.isApproved === false, `isApproved=${created.result?.isApproved}`);

  const teacherId = created.result?.userId ?? '';

  const duplicate = await service.create(createInput({ email: `${TEMP}-teacher@department.edu`, role: USER_ROLES.TEACHER }), asAdmin);
  check('refuses a duplicate email', !duplicate.success);
  check('tags the error to the email field', duplicate.errors[0]?.field === 'email', `field=${duplicate.errors[0]?.field}`);

  console.log('\n2. editing and switching an ordinary account');
  const updated = await service.update(
    {
      userId: teacherId,
      name: 'Verify Renamed',
      role: USER_ROLES.TEACHER,
      designation: 'Lecturer',
      studentId: '',
      semester: undefined,
      phone: '01700000000',
    },
    asAdmin
  );
  check('saves the new name', updated.result?.name === 'Verify Renamed', `name=${updated.result?.name}`);
  check('blank optional becomes null', updated.result?.studentId === null, `studentId=${String(updated.result?.studentId)}`);

  const deactivated = await service.setActive({ userId: teacherId, isActive: false }, asAdmin);
  check('deactivates', deactivated.result?.isActive === false);
  const reactivated = await service.setActive({ userId: teacherId, isActive: true }, asAdmin);
  check('reactivates', reactivated.result?.isActive === true);

  console.log('\n3. an administrator account is the super administrator’s alone');
  const adminByAdmin = await service.create(createInput({ email: `${TEMP}-admin-x@department.edu`, role: USER_ROLES.ADMIN }), asAdmin);
  check('an administrator cannot create an administrator', !adminByAdmin.success, JSON.stringify(adminByAdmin.errors));

  const promoteByAdmin = await service.update(
    { userId: teacherId, name: 'Verify Renamed', role: USER_ROLES.ADMIN, designation: '', studentId: '', semester: undefined, phone: '' },
    asAdmin
  );
  check('an administrator cannot promote into the role', !promoteByAdmin.success, JSON.stringify(promoteByAdmin.errors));

  const stillTeacher = await User.findById(teacherId).lean();
  check('and the teacher was not promoted anyway', stillTeacher?.role === USER_ROLES.TEACHER, `role=${stillTeacher?.role}`);

  console.log('\n4. the ceiling of three active administrators');
  const existingAdmins = await User.countDocuments({ role: USER_ROLES.ADMIN, isActive: true });
  console.log(`  (${existingAdmins} active administrator(s) already in the database, ceiling is ${ADMIN_LIMIT})`);

  const seats = Math.max(0, ADMIN_LIMIT - existingAdmins);
  const madeAdmins: string[] = [];

  for (let seat = 0; seat < seats; seat++) {
    const result = await service.create(createInput({ email: `${TEMP}-admin-${seat}@department.edu`, role: USER_ROLES.ADMIN }), asSuperAdmin);

    if (result.result) {
      madeAdmins.push(result.result.userId);
    }
  }

  check(`the super administrator filled the remaining ${seats} seat(s)`, madeAdmins.length === seats, `made ${madeAdmins.length}`);

  const overCeiling = await service.create(createInput({ email: `${TEMP}-admin-over@department.edu`, role: USER_ROLES.ADMIN }), asSuperAdmin);
  check('a fourth active administrator is refused', !overCeiling.success, JSON.stringify(overCeiling.errors));
  check('and the refusal names the role field', overCeiling.errors[0]?.field === 'role', `field=${overCeiling.errors[0]?.field}`);

  if (madeAdmins.length > 0) {
    const freed = madeAdmins[0];

    await service.setActive({ userId: freed, isActive: false }, asSuperAdmin);
    const afterFreeing = await service.create(
      createInput({ email: `${TEMP}-admin-replacement@department.edu`, role: USER_ROLES.ADMIN }),
      asSuperAdmin
    );
    check('deactivating one frees the seat', afterFreeing.success, JSON.stringify(afterFreeing.errors));

    const reactivateOverCeiling = await service.setActive({ userId: freed, isActive: true }, asSuperAdmin);
    check('reactivating back over the ceiling is refused', !reactivateOverCeiling.success, JSON.stringify(reactivateOverCeiling.errors));

    console.log('\n5. one administrator may not touch another');
    const target = afterFreeing.result?.userId ?? '';
    const editByPeer = await service.update(
      { userId: target, name: 'Renamed by a peer', role: USER_ROLES.ADMIN, designation: '', studentId: '', semester: undefined, phone: '' },
      asAdmin
    );
    check('an administrator cannot edit another administrator', !editByPeer.success, JSON.stringify(editByPeer.errors));

    const deactivateByPeer = await service.setActive({ userId: target, isActive: false }, asAdmin);
    check('an administrator cannot deactivate another administrator', !deactivateByPeer.success, JSON.stringify(deactivateByPeer.errors));
  } else {
    console.log('  SKIP  the database was already at the ceiling, so there was no seat to free');
  }

  console.log('\n6. nobody acts on their own role or access');
  const selfDeactivate = await service.setActive({ userId: teacherId, isActive: false }, requester(USER_ROLES.ADMIN, teacherId));
  check('cannot deactivate yourself', !selfDeactivate.success, JSON.stringify(selfDeactivate.errors));

  const selfRevoke = await service.setApproval({ userId: teacherId, isApproved: false }, requester(USER_ROLES.ADMIN, teacherId));
  check('cannot revoke your own approval', !selfRevoke.success, JSON.stringify(selfRevoke.errors));

  const selfDemote = await service.update(
    { userId: teacherId, name: 'Verify Renamed', role: USER_ROLES.STUDENT, designation: '', studentId: '', semester: undefined, phone: '' },
    requester(USER_ROLES.ADMIN, teacherId)
  );
  check('cannot move your own role', !selfDemote.success, JSON.stringify(selfDemote.errors));

  /*
    The self-rule permits a rename — it is about role and access, not every field — but
    that carve-out is unreachable for anyone who can actually reach this screen. An
    administrator's own row is an administrator row, so the "administrators are the super
    administrator's alone" rule answers first; the super administrator's own row is
    immutable. Asserted as it really behaves rather than as the carve-out reads, because
    an earlier version of this check passed only by using a requester that cannot exist:
    a session claiming `admin` carrying a teacher's id.

    Step 13's `/profile` is where an account edits itself. Until then, nobody in the
    admin area renames themselves through this screen.
  */
  const adminRenamesSelf = await service.update(
    { userId: madeAdmins[0] ?? teacherId, name: 'Renamed', role: USER_ROLES.ADMIN, designation: '', studentId: '', semester: undefined, phone: '' },
    requester(USER_ROLES.ADMIN, madeAdmins[0] ?? teacherId)
  );
  check('an administrator cannot rename themselves here either', !adminRenamesSelf.success, JSON.stringify(adminRenamesSelf.errors));

  console.log('\n7. the super administrator');
  const createSuper = await service.create(createInput({ email: `${TEMP}-super@department.edu`, role: USER_ROLES.SUPER_ADMIN }), asSuperAdmin);
  check('nobody can create a super administrator, not even one', !createSuper.success, JSON.stringify(createSuper.errors));

  const promoteToSuper = await service.update(
    { userId: teacherId, name: 'Verify Self Renamed', role: USER_ROLES.SUPER_ADMIN, designation: '', studentId: '', semester: undefined, phone: '' },
    asSuperAdmin
  );
  check('and nobody can be promoted into the role', !promoteToSuper.success, JSON.stringify(promoteToSuper.errors));

  /*
    The immutability and unique-index checks need a super administrator to exist. If the
    department has seeded one, it is used only as the target of refusals, which do not
    write. If it has not, a throwaway one is minted here and deleted with everything else
    — the alternative was skipping the checks that matter most in this step.
  */
  const alreadySeeded = await User.findOne({ role: USER_ROLES.SUPER_ADMIN }).lean();
  const temporarySuperAdmin = alreadySeeded
    ? null
    : await User.create({
        name: 'Verify Super',
        email: `${TEMP}-super-admin@department.edu`,
        password: 'temp-password-123',
        role: USER_ROLES.SUPER_ADMIN,
        isApproved: true,
      });

  console.log(
    alreadySeeded ? '  (using the seeded super administrator as a refusal target)' : '  (minted a throwaway super administrator for these checks)'
  );

  const seeded = alreadySeeded ?? temporarySuperAdmin;

  if (seeded) {
    const seededId = String(seeded._id);

    const editSeeded = await service.update(
      { userId: seededId, name: 'Renamed', role: USER_ROLES.ADMIN, designation: '', studentId: '', semester: undefined, phone: '' },
      asSuperAdmin
    );
    check('the seeded account cannot be edited or demoted', !editSeeded.success, JSON.stringify(editSeeded.errors));

    const deactivateSeeded = await service.setActive({ userId: seededId, isActive: false }, asSuperAdmin);
    check('nor deactivated', !deactivateSeeded.success, JSON.stringify(deactivateSeeded.errors));

    const untouched = await User.findById(seededId).lean();
    check('and it is genuinely untouched', untouched?.role === USER_ROLES.SUPER_ADMIN && untouched?.isActive === true);

    // The index, not the service: this bypasses every rule above and must still fail.
    let indexRefused = false;

    try {
      await User.create({
        name: 'Second Super',
        email: `${TEMP}-second-super@department.edu`,
        password: 'temp-password-123',
        role: USER_ROLES.SUPER_ADMIN,
      });
    } catch {
      indexRefused = true;
    }

    check('a second super administrator is refused by the unique index', indexRefused);
  } else {
    console.log('  SKIP  could not obtain a super administrator to test against');
  }

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
