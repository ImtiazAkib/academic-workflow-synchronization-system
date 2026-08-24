import mongoose from 'mongoose';

import { ClassSession } from '@/models/class-session.model';
import { Course } from '@/models/course.model';
import { User } from '@/models/user.model';

import { DEPARTMENTS } from '@/constants/account.const';
import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import { ClassSessionService } from '@/lib/services/class-session.service';
import { issueLoginId } from '@/lib/services/login-id.issuer';

import type { DayOfWeek } from '@/types';

/*
  Seeds a demo department so the whole application can be walked without hand-entering a
  term's worth of data: one administrator, two teachers, five students, four courses and a
  week of classes. It is step 16's "seed a demo department" deliverable, the sibling of
  `seed-super-admin` — that one bootstraps the real department, this one fills a throwaway
  one for a demo or a manual smoke test.

    npm run seed:demo

  EVERYTHING it writes is marked so it can be found and removed exactly: accounts sit on the
  `@demo.academic.local` address, courses carry the `DMO` code prefix. The seed clears any
  previous demo data under those markers before writing, so re-running it produces a fresh
  demo rather than duplicates — and it touches nothing outside them.

  Point it at a development or throwaway database, not a production one: the demo admin,
  teachers and students would otherwise appear in a real department's directories, and the
  demo admin counts against the three-administrator ceiling. It reads `.env.local` like the
  other scripts, so set `MONGODB_URI` to the target before running.
*/
const DEMO_EMAIL_DOMAIN = 'demo.academic.local';
const DEMO_COURSE_PREFIX = 'DMO';
// Printed at the end. A demo password, never a real one — the accounts exist to be shown.
const DEMO_PASSWORD = 'demo-password-123';
const DEPARTMENT = DEPARTMENTS[0];
const COHORT_SEMESTER = 3;
const COHORT_SESSION = '2023-24';

const SUN: DayOfWeek = 0;
const MON: DayOfWeek = 1;
const TUE: DayOfWeek = 2;
const WED: DayOfWeek = 3;
const THU: DayOfWeek = 4;

const sessions = new ClassSessionService();

type SeededTeacher = { id: string; loginId: string; name: string };

async function clearDemo(): Promise<void> {
  const demoCourses = await Course.find({ code: { $regex: `^${DEMO_COURSE_PREFIX}` } }).lean();

  await ClassSession.deleteMany({ course: { $in: demoCourses.map(course => course._id) } });
  await Course.deleteMany({ code: { $regex: `^${DEMO_COURSE_PREFIX}` } });
  await User.deleteMany({ email: { $regex: `@${DEMO_EMAIL_DOMAIN}$` } });
}

async function seedAdmin(): Promise<void> {
  await User.create({
    name: 'Demo Administrator',
    email: `admin@${DEMO_EMAIL_DOMAIN}`,
    password: DEMO_PASSWORD,
    role: USER_ROLES.ADMIN,
    department: DEPARTMENT,
    // A usable account signs in only when both are true; the seed vouches for the address.
    isApproved: true,
    isActive: true,
    emailVerified: true,
  });
}

async function seedTeacher(index: number): Promise<SeededTeacher> {
  const loginId = await issueLoginId(USER_ROLES.TEACHER);

  if (!loginId) {
    throw new Error('Could not issue a teacher login ID');
  }

  const name = `Demo Teacher ${index + 1}`;
  const teacher = await User.create({
    name,
    email: `teacher${index + 1}@${DEMO_EMAIL_DOMAIN}`,
    password: DEMO_PASSWORD,
    role: USER_ROLES.TEACHER,
    department: DEPARTMENT,
    designation: index === 0 ? 'Associate Professor' : 'Lecturer',
    loginId,
    isApproved: true,
    isActive: true,
    emailVerified: true,
  });

  return { id: String(teacher._id), loginId, name };
}

async function seedStudent(index: number): Promise<string> {
  const loginId = await issueLoginId(USER_ROLES.STUDENT);

  if (!loginId) {
    throw new Error('Could not issue a student login ID');
  }

  // Distinct roll numbers, since the model holds a partial unique index on a student's roll.
  const roll = `2310${String(index + 1).padStart(3, '0')}`;

  await User.create({
    name: `Demo Student ${index + 1}`,
    email: `student${index + 1}@${DEMO_EMAIL_DOMAIN}`,
    password: DEMO_PASSWORD,
    role: USER_ROLES.STUDENT,
    department: DEPARTMENT,
    roll,
    registrationNo: `2023${roll}`,
    session: COHORT_SESSION,
    semester: COHORT_SEMESTER,
    loginId,
    isApproved: true,
    isActive: true,
    emailVerified: true,
  });

  return loginId;
}

async function seedCourse(code: string, title: string, teacher: SeededTeacher): Promise<string> {
  const course = await Course.create({
    code,
    title,
    semester: COHORT_SEMESTER,
    credits: 3,
    assignedTeacher: new mongoose.Types.ObjectId(teacher.id),
    isActive: true,
  });

  return String(course._id);
}

async function seedWeek(courseId: string, teacherId: string, day: DayOfWeek, startTime: string, endTime: string): Promise<void> {
  const result = await sessions.create({ courseId, teacherId, dayOfWeek: day, startTime, endTime, semester: COHORT_SEMESTER });

  if (!result.success) {
    throw new Error(`Could not schedule a class: ${JSON.stringify(result.errors)}`);
  }
}

async function run(): Promise<void> {
  await connectToDatabase();
  console.log(`Connected to "${mongoose.connection.name}".`);
  console.log('Clearing any previous demo data...');
  await clearDemo();

  await seedAdmin();

  const teacherOne = await seedTeacher(0);
  const teacherTwo = await seedTeacher(1);

  const studentLoginIds: string[] = [];

  for (let index = 0; index < 5; index++) {
    studentLoginIds.push(await seedStudent(index));
  }

  const structures = await seedCourse(`${DEMO_COURSE_PREFIX}-301`, 'Data Structures', teacherOne);
  const algorithms = await seedCourse(`${DEMO_COURSE_PREFIX}-302`, 'Algorithms', teacherOne);
  const databases = await seedCourse(`${DEMO_COURSE_PREFIX}-303`, 'Database Systems', teacherTwo);
  const networks = await seedCourse(`${DEMO_COURSE_PREFIX}-304`, 'Computer Networks', teacherTwo);

  // A week of classes, spread so no teacher is booked into two rooms at once.
  await seedWeek(structures, teacherOne.id, SUN, '09:00', '10:30');
  await seedWeek(algorithms, teacherOne.id, MON, '09:00', '10:30');
  await seedWeek(structures, teacherOne.id, WED, '09:00', '10:30');
  await seedWeek(databases, teacherTwo.id, SUN, '10:30', '12:00');
  await seedWeek(networks, teacherTwo.id, TUE, '09:00', '10:30');
  await seedWeek(databases, teacherTwo.id, THU, '10:30', '12:00');

  console.log('\nSeeded a demo department:');
  console.log(`  Administrator   admin@${DEMO_EMAIL_DOMAIN}  (signs in with the email)`);
  console.log(`  Teachers        ${teacherOne.loginId}, ${teacherTwo.loginId}`);
  console.log(`  Students        ${studentLoginIds.join(', ')}`);
  console.log('  Courses         4, in semester 3');
  console.log('  Classes         6 across the week');
  console.log(`\nEvery account's password is "${DEMO_PASSWORD}". Teachers and students sign in with their login ID.`);

  await mongoose.disconnect();
}

run().catch(async error => {
  console.error('Seeding the demo department failed:', error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
