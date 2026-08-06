import mongoose from 'mongoose';

import { ClassSession } from '@/models/class-session.model';
import { Course } from '@/models/course.model';
import { User } from '@/models/user.model';

import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import { ClassSessionService } from '@/lib/services/class-session.service';
import { CourseService } from '@/lib/services/course.service';

import type { DayOfWeek } from '@/types';

/*
  Exercises conflict detection — the rule step 8 exists for — which no screen reaches
  yet. It creates two throwaway teachers, two courses and a handful of sessions, all
  prefixed so cleanup is exact, then deletes them. Run with `npm run verify:schedule`.
*/
const TEMP = 'schedule-verify';
const TEMP_CODE_PREFIX = '^ZZV';
const MONDAY: DayOfWeek = 1;
const TUESDAY: DayOfWeek = 2;
const SEMESTER = 7;

const sessions = new ClassSessionService();
const courses = new CourseService();

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

  await ClassSession.deleteMany({ course: { $in: owned.map(x => x._id) } });
  await Course.deleteMany({ code: { $regex: TEMP_CODE_PREFIX } });
  await User.deleteMany({ email: { $regex: `^${TEMP}` } });
}

async function run(): Promise<void> {
  await connectToDatabase();
  await cleanup();

  const teacherA = await User.create({
    name: 'Verify Teacher A',
    email: `${TEMP}-a@department.edu`,
    password: 'temp-password-123',
    role: USER_ROLES.TEACHER,
    isApproved: true,
  });
  const teacherB = await User.create({
    name: 'Verify Teacher B',
    email: `${TEMP}-b@department.edu`,
    password: 'temp-password-123',
    role: USER_ROLES.TEACHER,
    isApproved: true,
  });
  const courseA = await Course.create({ code: 'ZZV-101', title: 'Verify A', semester: SEMESTER, credits: 3 });
  const courseB = await Course.create({ code: 'ZZV-102', title: 'Verify B', semester: SEMESTER, credits: 3 });

  const base = {
    courseId: String(courseA._id),
    teacherId: String(teacherA._id),
    dayOfWeek: MONDAY,
    startTime: '09:00',
    endTime: '10:00',
    semester: SEMESTER,
  };

  console.log('\n1. first booking');
  const first = await sessions.create(base);
  check('books a free slot', first.success, JSON.stringify(first.errors));

  const firstId = first.result?.classSessionId ?? '';

  console.log('\n2. the two clashes');
  const teacherClash = await sessions.create({ ...base, courseId: String(courseB._id), startTime: '09:30' });
  check('same teacher, overlapping -> refused', !teacherClash.success);
  check(
    'names the teacher',
    teacherClash.errors.some(x => x.field === 'teacherId'),
    JSON.stringify(teacherClash.errors)
  );

  const courseClash = await sessions.create({ ...base, teacherId: String(teacherB._id), startTime: '09:30' });
  check('same course, overlapping -> refused', !courseClash.success);
  check(
    'names the course',
    courseClash.errors.some(x => x.field === 'courseId'),
    JSON.stringify(courseClash.errors)
  );

  console.log('\n3. both at once');
  const everything = await sessions.create({ ...base, startTime: '09:30' });
  check('reports both together', everything.errors.length === 2, `got ${everything.errors.length}: ${JSON.stringify(everything.errors)}`);

  console.log('\n4. the boundaries');
  const backToBack = await sessions.create({
    ...base,
    courseId: String(courseB._id),
    teacherId: String(teacherB._id),
    startTime: '10:00',
    endTime: '11:00',
  });
  check('back-to-back is allowed', backToBack.success, JSON.stringify(backToBack.errors));

  const otherDay = await sessions.create({ ...base, dayOfWeek: TUESDAY });
  check('same slot on another day is allowed', otherDay.success, JSON.stringify(otherDay.errors));

  const otherSemester = await sessions.create({ ...base, semester: SEMESTER + 1 });
  check('same slot in another semester is allowed', otherSemester.success, JSON.stringify(otherSemester.errors));

  console.log('\n5. moving a session');
  const selfMove = await sessions.update({ ...base, classSessionId: firstId });
  check('a session does not clash with itself', selfMove.success, JSON.stringify(selfMove.errors));

  /*
    Two different classes may now share a slot. Nothing tracks where a class physically
    sits since the room field went, so a different teacher teaching a different course
    at the same hour is not a clash any more. Asserted rather than assumed, because it
    is the rule that changed.
  */
  const sharedSlot = await sessions.update({ ...base, classSessionId: firstId, startTime: '10:00', endTime: '11:00' });
  check('a different teacher and course may share a slot', sharedSlot.success, JSON.stringify(sharedSlot.errors));

  // Moving onto a slot where the same teacher is already busy is still refused.
  const moveOntoBusyTeacher = await sessions.update({
    ...base,
    classSessionId: firstId,
    teacherId: String(teacherB._id),
    startTime: '10:00',
    endTime: '11:00',
  });
  check('moving onto a slot the teacher already holds is refused', !moveOntoBusyTeacher.success, JSON.stringify(moveOntoBusyTeacher.errors));

  console.log('\n6. course deactivation');
  const blocked = await courses.setActive(String(courseA._id), false);
  check('refuses deactivating a scheduled course', !blocked.success, JSON.stringify(blocked.errors));

  console.log('\n7. bad references');
  const badCourse = await sessions.create({
    ...base,
    startTime: '14:00',
    endTime: '15:00',
    courseId: String(new mongoose.Types.ObjectId()),
  });
  check('refuses a course that does not exist', !badCourse.success && badCourse.errors[0]?.field === 'courseId', JSON.stringify(badCourse.errors));

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
