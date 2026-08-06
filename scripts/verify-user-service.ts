import mongoose from 'mongoose';

import { User } from '@/models/user.model';

import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import { UserService } from '@/lib/services/user.service';

/*
  Exercises the UserService paths a browser check cannot reach without signing in —
  editing, deactivation, the last-administrator guard and duplicate-email validation.

  Safe to run against a real database: it creates one throwaway teacher and deletes it
  again, and the administrator is only ever the *target* of refusals, which by
  definition do not write. Run with `npm run verify:users`.
*/
const TEMP_EMAIL = 'verify-temp@department.edu';

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

async function run(): Promise<void> {
  await connectToDatabase();
  await User.deleteOne({ email: TEMP_EMAIL });

  console.log('\n1. create');
  const created = await service.create({
    name: 'Verify Temp',
    email: TEMP_EMAIL,
    password: 'temp-password-123',
    role: USER_ROLES.TEACHER,
    designation: '',
    studentId: '',
    phone: '',
  });
  check('creates a teacher', created.success && created.result !== null);
  check('starts unapproved', created.result?.isApproved === false, `isApproved=${created.result?.isApproved}`);

  const userId = created.result?.userId ?? '';

  console.log('\n2. duplicate email');
  const duplicate = await service.create({
    name: 'Another',
    email: TEMP_EMAIL,
    password: 'temp-password-123',
    role: USER_ROLES.TEACHER,
    designation: '',
    studentId: '',
    phone: '',
  });
  check('refuses a duplicate email', !duplicate.success);
  check('tags the error to the email field', duplicate.errors[0]?.field === 'email', `field=${duplicate.errors[0]?.field}`);

  console.log('\n3. update');
  const updated = await service.update({
    userId,
    name: 'Verify Renamed',
    role: USER_ROLES.TEACHER,
    designation: 'Lecturer',
    studentId: '',
    phone: '01700000000',
  });
  check('saves the new name', updated.result?.name === 'Verify Renamed', `name=${updated.result?.name}`);
  check('saves the designation', updated.result?.designation === 'Lecturer', `designation=${updated.result?.designation}`);
  check('blank optional becomes null', updated.result?.studentId === null, `studentId=${String(updated.result?.studentId)}`);

  console.log('\n4. deactivate and reactivate');
  const deactivated = await service.setActive({ userId, isActive: false });
  check('deactivates', deactivated.result?.isActive === false, `isActive=${deactivated.result?.isActive}`);
  const reactivated = await service.setActive({ userId, isActive: true });
  check('reactivates', reactivated.result?.isActive === true, `isActive=${reactivated.result?.isActive}`);

  console.log('\n5. last-administrator guard');
  const admins = await User.find({ role: USER_ROLES.ADMIN, isApproved: true, isActive: true }).lean();
  const adminId = String(admins[0]?._id ?? '');
  console.log(`  (${admins.length} usable administrator(s) in the database)`);

  const deactivateAdmin = await service.setActive({ userId: adminId, isActive: false });
  const demoteAdmin = await service.update({
    userId: adminId,
    name: String(admins[0]?.name ?? ''),
    role: USER_ROLES.TEACHER,
    designation: '',
    studentId: '',
    phone: '',
  });

  if (admins.length === 1) {
    check('refuses deactivating the last admin', !deactivateAdmin.success, JSON.stringify(deactivateAdmin.errors));
    check('refuses demoting the last admin', !demoteAdmin.success, JSON.stringify(demoteAdmin.errors));

    const stillAdmin = await User.findById(adminId).lean();
    check('admin untouched', stillAdmin?.role === USER_ROLES.ADMIN && stillAdmin?.isActive === true);
  } else {
    console.log('  SKIP  more than one administrator, so the guard should not fire here');
  }

  await User.deleteOne({ email: TEMP_EMAIL });
  console.log('\ncleaned up the temporary account.');
  console.log(`\npassed ${passed}, failed ${failed}`);

  await mongoose.disconnect();
  process.exitCode = failed > 0 ? 1 : 0;
}

run().catch(async error => {
  console.error('verification failed:', error instanceof Error ? error.message : error);
  await User.deleteOne({ email: TEMP_EMAIL }).catch(() => undefined);
  await mongoose.disconnect();
  process.exitCode = 1;
});
