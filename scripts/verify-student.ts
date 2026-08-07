import mongoose from 'mongoose';

import { ClassSession } from '@/models/class-session.model';
import { Course } from '@/models/course.model';
import { Material } from '@/models/material.model';
import { User } from '@/models/user.model';

import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import { UserCreateSchema } from '@/lib/schemas';
import { StudentService } from '@/lib/services/student.service';
import { UserService } from '@/lib/services/user.service';

import type { DayOfWeek, SessionUser } from '@/types';

/*
  Exercises the rules behind the student area, which no screen can be driven to from
  here — every one of them sits behind the student guard, and this script does not sign
  in. What it can prove is the layer underneath: that a routine is scoped to the
  student's own semester, that the teacher directory publishes no phone number, and that
  a semester does not survive a change of role.

  Everything it creates is prefixed so cleanup is exact, and it deletes it all again.
  Run with `npm run verify:student`.
*/
const TEMP = 'student-verify';
const TEMP_CODE_PREFIX = '^ZZS';
const MINE = 7;
const OTHER = 8;
const MONDAY: DayOfWeek = 1;

/*
  Step 11 made every mutating UserService method take the account making the request.
  These three calls are about the semester rather than about authorization, so they act
  as a plain administrator — which is exactly who edits a student in practice.
*/
const asAdmin: SessionUser = {
  userId: String(new mongoose.Types.ObjectId()),
  email: `${TEMP}-admin@department.edu`,
  name: 'Verify Admin',
  role: USER_ROLES.ADMIN,
  isApproved: true,
};

const students = new StudentService();
const users = new UserService();

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

async function cleanup(): Promise<void> {
  const owned = await Course.find({ code: { $regex: TEMP_CODE_PREFIX } }).lean();
  const courseIds = owned.map(x => x._id);

  await Material.deleteMany({ course: { $in: courseIds } });
  await ClassSession.deleteMany({ course: { $in: courseIds } });
  await Course.deleteMany({ code: { $regex: TEMP_CODE_PREFIX } });
  await User.deleteMany({ email: { $regex: `^${TEMP}` } });
}

async function run(): Promise<void> {
  await connectToDatabase();
  await cleanup();

  const teacher = await User.create({
    name: 'Verify Teacher',
    email: `${TEMP}-teacher@department.edu`,
    password: 'temp-password-123',
    role: USER_ROLES.TEACHER,
    isApproved: true,
    designation: 'Assistant Professor',
    phone: '01700000000',
  });

  const pendingTeacher = await User.create({
    name: 'Verify Pending Teacher',
    email: `${TEMP}-pending@department.edu`,
    password: 'temp-password-123',
    role: USER_ROLES.TEACHER,
    isApproved: false,
  });

  const inactiveTeacher = await User.create({
    name: 'Verify Inactive Teacher',
    email: `${TEMP}-inactive@department.edu`,
    password: 'temp-password-123',
    role: USER_ROLES.TEACHER,
    isApproved: true,
    isActive: false,
  });

  const student = await User.create({
    name: 'Verify Student',
    email: `${TEMP}-student@department.edu`,
    password: 'temp-password-123',
    role: USER_ROLES.STUDENT,
    isApproved: true,
    semester: MINE,
  });

  const mineCourse = await Course.create({ code: 'ZZS-101', title: 'Mine', semester: MINE, credits: 3, assignedTeacher: teacher._id });
  const otherCourse = await Course.create({ code: 'ZZS-102', title: 'Another year', semester: OTHER, credits: 3, assignedTeacher: teacher._id });
  const retiredCourse = await Course.create({
    code: 'ZZS-103',
    title: 'Deactivated',
    semester: MINE,
    credits: 3,
    assignedTeacher: teacher._id,
    isActive: false,
  });

  const base = { teacher: teacher._id, dayOfWeek: MONDAY, startTime: '09:00', endTime: '10:00' };

  await ClassSession.create({ ...base, course: mineCourse._id, semester: MINE });
  await ClassSession.create({ ...base, course: mineCourse._id, semester: MINE, startTime: '11:00', endTime: '12:00', isCancelled: true });
  await ClassSession.create({ ...base, course: otherCourse._id, semester: OTHER, startTime: '13:00', endTime: '14:00' });

  const storedFile = { uploadedBy: teacher._id, mimeType: 'application/pdf', size: 1024, storageKey: 'verify-not-a-real-key' };

  await Material.create({ ...storedFile, course: mineCourse._id, title: 'Mine', fileName: 'mine.pdf' });
  await Material.create({ ...storedFile, course: otherCourse._id, title: 'Another year', fileName: 'other.pdf' });
  await Material.create({ ...storedFile, course: retiredCourse._id, title: 'Deactivated course', fileName: 'retired.pdf' });

  console.log('\n1. the semester on the account');
  const profile = await students.getProfile(String(student._id));
  check('reads the student back', profile.success && profile.result?.semester === MINE, JSON.stringify(profile.errors));

  const missing = await students.getProfile(String(new mongoose.Types.ObjectId()));
  check('refuses an account that does not exist', !missing.success);

  console.log('\n2. the routine is scoped to that semester');
  const routine = await students.getRoutine(MINE);
  check(
    'returns only this semester',
    routine.result.every(x => x.semester === MINE),
    JSON.stringify(routine.result.map(x => x.semester))
  );
  check('another year is not visible', routine.result.length === 2, `got ${routine.result.length}`);
  check(
    'a cancelled class is still listed',
    routine.result.some(x => x.isCancelled)
  );

  console.log('\n3. courses');
  const courses = await students.listCourses(MINE);
  check(
    'lists the semester course',
    courses.result.some(x => x.code === 'ZZS-101')
  );
  check('leaves out another semester', !courses.result.some(x => x.code === 'ZZS-102'));
  check('leaves out a deactivated course', !courses.result.some(x => x.code === 'ZZS-103'));

  console.log('\n4. materials follow the same scope');
  const materials = await students.listMaterials(MINE);
  check(
    'lists the semester file',
    materials.result.some(x => x.title === 'Mine')
  );
  check("leaves out another semester's file", !materials.result.some(x => x.title === 'Another year'));
  /*
    The invariant `findSemesterCourses` exists for: a file whose course is hidden from
    the course list must not still be reachable from the material list.
  */
  check('leaves out a deactivated course’s file', !materials.result.some(x => x.title === 'Deactivated course'));
  check(
    'never leaks a storage key',
    materials.result.every(x => !('storageKey' in x))
  );

  const emptySemester = await students.listMaterials(2);
  check('a semester with no courses returns nothing, not everything', emptySemester.success && emptySemester.result.length === 0);

  console.log('\n5. the teacher directory');
  const directory = await students.listTeachers();
  const entry = directory.result.find(x => x.userId === String(teacher._id));

  check('lists an approved, active teacher', Boolean(entry));
  check('leaves out a pending account', !directory.result.some(x => x.userId === String(pendingTeacher._id)));
  check('leaves out a deactivated account', !directory.result.some(x => x.userId === String(inactiveTeacher._id)));
  check('leaves out students', !directory.result.some(x => x.userId === String(student._id)));
  check('carries the contact address', entry?.email === `${TEMP}-teacher@department.edu`);
  check('carries the designation', entry?.designation === 'Assistant Professor');
  // The decision the DTO exists to hold: a personal number is not published to students.
  check('publishes no phone number', entry ? !('phone' in entry) : false, JSON.stringify(entry));
  check('publishes no account state', entry ? !('isApproved' in entry) && !('isActive' in entry) : false);
  check('names the courses they take', entry?.courses.some(x => x.code === 'ZZS-101') === true, JSON.stringify(entry?.courses));
  check('leaves a deactivated course off the card', entry?.courses.some(x => x.code === 'ZZS-103') === false);

  console.log('\n6. a semester belongs to a student and nobody else');
  const parseSemester = (semester: unknown) =>
    UserCreateSchema.safeParse({
      name: 'X',
      email: `${TEMP}-parse@department.edu`,
      password: 'temp-password-123',
      role: USER_ROLES.STUDENT,
      semester,
    });

  const parsedBlank = parseSemester('');
  check('an untouched select means no semester', parsedBlank.success && parsedBlank.data.semester === undefined);

  const parsedValid = parseSemester('3');
  check('a chosen semester arrives as a number', parsedValid.success && parsedValid.data.semester === 3);

  check('nine is refused', !parseSemester('9').success);
  check('zero is refused', !parseSemester('0').success);
  check('a fractional semester is refused', !parseSemester('3.5').success);
  check('text is refused', !parseSemester('abc').success);

  /*
    The check that matters most, and the one whose absence hid a real bug: the value is
    parsed TWICE. `zodResolver` transforms it in the browser, then the Server Action
    re-validates whatever the form hands it, because an action is a public endpoint and
    cannot trust its caller. A string-only schema rejected its own output on that second
    pass, and no student could be given a semester at all — silently, because the type
    error carries no encoded code and surfaced as the generic message.
  */
  const roundTripped = parsedValid.success ? parseSemester(parsedValid.data.semester) : parsedValid;
  check(
    'parsing is idempotent — the action can re-validate the form’s own output',
    roundTripped.success && roundTripped.data.semester === 3,
    roundTripped.success ? '' : JSON.stringify(roundTripped.error.issues[0])
  );

  const blankRoundTripped = parsedBlank.success ? parseSemester(parsedBlank.data.semester) : parsedBlank;
  check('an absent semester survives the round trip too', blankRoundTripped.success && blankRoundTripped.data.semester === undefined);

  // The same second pass must still refuse a hand-built request carrying a bad number.
  check('a raw out-of-range number is refused', !parseSemester(9).success);

  const createdTeacher = await users.create(
    {
      name: 'Verify Teacher Two',
      email: `${TEMP}-teacher-two@department.edu`,
      password: 'temp-password-123',
      role: USER_ROLES.TEACHER,
      semester: 4,
    },
    asAdmin
  );
  check('a semester on a teacher is dropped', createdTeacher.success && !createdTeacher.result?.semester, JSON.stringify(createdTeacher.result));

  console.log('\n7. clearing a field actually clears it');
  /*
    Mongoose drops `undefined` keys from an update rather than clearing the field, so
    before `toUpdateDocument()` this promotion left the year on the record — gone from
    every screen and still in the database.
  */
  const promoted = await users.update(
    {
      userId: String(student._id),
      name: 'Verify Student',
      role: USER_ROLES.TEACHER,
      designation: '',
      roll: '',
      phone: '',
    },
    asAdmin
  );
  check('promoting a student to a teacher succeeds', promoted.success, JSON.stringify(promoted.errors));

  const afterPromotion = await User.findById(student._id).lean();
  check('the semester is gone from the record', afterPromotion?.semester === undefined, JSON.stringify(afterPromotion?.semester));

  const clearedDesignation = await users.update(
    {
      userId: String(teacher._id),
      name: 'Verify Teacher',
      role: USER_ROLES.TEACHER,
      designation: '',
      roll: '',
      phone: '',
    },
    asAdmin
  );
  check('emptying a designation succeeds', clearedDesignation.success, JSON.stringify(clearedDesignation.errors));

  const afterClear = await User.findById(teacher._id).lean();
  check('the designation is gone too', afterClear?.designation === undefined, JSON.stringify(afterClear?.designation));

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
