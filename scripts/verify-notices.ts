import mongoose from 'mongoose';

import { Notice } from '@/models/notice.model';
import { User } from '@/models/user.model';

import { CODES } from '@/constants/codes.const';
import { NOTICE_AUDIENCES } from '@/constants/notice.const';
import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import { NoticeCreateSchema } from '@/lib/schemas';
import { NoticeService } from '@/lib/services';

import type { NoticeAudience, SessionUser, UserRole } from '@/types';

/*
  Exercises what a notice reaches and, far more importantly, what it does not.

  The audience rule is the only thing in this step that can be wrong in a way nobody sees:
  a screen that renders the right notices while the server sent the wrong ones looks
  correct and has already disclosed them. So the checks below read the *service*, which is
  what decides the payload, rather than the component that paints it.

  Every row it writes carries the `notice-verify` prefix — on the title for notices, on the
  email for accounts — and is deleted afterwards.

  Run with `npm run verify:notices`.
*/
const TEMP = 'notice-verify';
const PASSWORD = 'temp-password-123';

const VALIDATION = CODES.VALIDATION.NOTICES;

const notices = new NoticeService();

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

/**
 * Create an account to publish or read as.
 *
 * @param role - Which kind of account.
 * @param name - Distinguishes this row's address from the others.
 *
 * @returns The requester a Server Action would have built from the session cookie.
 */
async function seedUser(role: UserRole, name: string): Promise<SessionUser> {
  const created = await User.create({
    name: `Verify ${name}`,
    email: `${TEMP}-${name}@department.edu`,
    password: PASSWORD,
    role,
    emailVerified: true,
    isApproved: true,
    isActive: true,
  });

  return { userId: String(created._id), email: created.email, name: created.name, role, isApproved: true };
}

/**
 * Publish one notice through the real path — schema, then service.
 *
 * @param audience - Who it is addressed to.
 * @param requester - The account publishing it.
 *
 * @returns The notice's title, which is how the assertions identify it.
 */
async function publish(audience: NoticeAudience, requester: SessionUser): Promise<string> {
  const title = `${TEMP} for ${audience}`;

  const result = await notices.create(NoticeCreateSchema.parse({ title, body: `Body of the ${audience} notice.`, audience }), requester);

  if (!result.success) {
    throw new Error(`could not publish the ${audience} notice: ${JSON.stringify(result.errors)}`);
  }

  return title;
}

/**
 * The seeded titles a role can actually see, so an assertion reads as a set comparison
 * rather than as index arithmetic over a list that also holds the department's real rows.
 *
 * @param role - The viewer's role.
 *
 * @returns The titles this run seeded, in the order the service returned them.
 */
async function titlesFor(role: UserRole): Promise<string[]> {
  const result = await notices.listForRole(role);

  return result.result.map(x => x.title).filter(x => x.startsWith(TEMP));
}

async function cleanup(): Promise<void> {
  await Notice.deleteMany({ title: { $regex: `^${TEMP}` } });
  await User.deleteMany({ email: { $regex: `^${TEMP}` } });
}

async function run(): Promise<void> {
  await connectToDatabase();
  await User.init();
  await cleanup();

  console.log('\n1. publishing');

  const admin = await seedUser(USER_ROLES.ADMIN, 'admin');
  const teacher = await seedUser(USER_ROLES.TEACHER, 'teacher');
  const student = await seedUser(USER_ROLES.STUDENT, 'student');

  const forAll = await publish(NOTICE_AUDIENCES.ALL, admin);
  const forTeachers = await publish(NOTICE_AUDIENCES.TEACHERS, admin);
  const forStudents = await publish(NOTICE_AUDIENCES.STUDENTS, admin);

  const stored = await Notice.findOne({ title: forStudents }).lean();

  check('a notice is published', Boolean(stored));
  check('it records who published it', String(stored?.publishedBy) === admin.userId, String(stored?.publishedBy));
  check('and when', stored?.publishedAt instanceof Date);
  check('the audience is stored as chosen', stored?.audience === NOTICE_AUDIENCES.STUDENTS, String(stored?.audience));

  console.log('\n2. a student sees what is addressed to students');

  const studentSees = await titlesFor(USER_ROLES.STUDENT);

  check('the department-wide notice reaches them', studentSees.includes(forAll));
  check('so does the students one', studentSees.includes(forStudents));
  /*
    The check this file exists for. Not "the screen hides it" — the service must never
    return it, because the payload is the disclosure whatever the screen does with it.
  */
  check('the teachers-only notice does not', !studentSees.includes(forTeachers), studentSees.join(' | '));
  check('and that is exactly two notices', studentSees.length === 2, studentSees.join(' | '));

  console.log('\n3. a teacher sees the mirror image');

  const teacherSees = await titlesFor(USER_ROLES.TEACHER);

  check('the department-wide notice reaches them', teacherSees.includes(forAll));
  check('so does the teachers one', teacherSees.includes(forTeachers));
  check('the students-only notice does not', !teacherSees.includes(forStudents), teacherSees.join(' | '));
  check('and that is exactly two notices', teacherSees.length === 2, teacherSees.join(' | '));

  console.log('\n4. the admin area sees all three');

  const adminSees = await titlesFor(USER_ROLES.ADMIN);
  const superAdminSees = await titlesFor(USER_ROLES.SUPER_ADMIN);

  check('an administrator sees every audience', adminSees.length === 3, adminSees.join(' | '));
  check('including the teachers one', adminSees.includes(forTeachers));
  check('including the students one', adminSees.includes(forStudents));
  check('the super administrator sees the same three', superAdminSees.length === 3, superAdminSees.join(' | '));

  console.log('\n5. newest first, and limited');

  const ordered = await notices.listForRole(USER_ROLES.ADMIN);
  const seeded = ordered.result.filter(x => x.title.startsWith(TEMP));

  check('the newest notice is first', seeded[0]?.title === forStudents, seeded.map(x => x.title).join(' | '));

  const limited = await notices.listForRole(USER_ROLES.ADMIN, 1);

  check('a limit is applied', limited.result.length === 1, String(limited.result.length));

  const unlimited = await notices.listForRole(USER_ROLES.ADMIN, null);

  check('and null means every one of them', unlimited.result.length >= 3, String(unlimited.result.length));

  console.log('\n6. what the schema refuses');

  const blankTitle = NoticeCreateSchema.safeParse({ title: '   ', body: 'Something', audience: NOTICE_AUDIENCES.ALL });

  check('a blank title is refused', !blankTitle.success);

  const blankBody = NoticeCreateSchema.safeParse({ title: 'Something', body: '', audience: NOTICE_AUDIENCES.ALL });

  check('an empty announcement is refused', !blankBody.success);

  const strangeAudience = NoticeCreateSchema.safeParse({ title: 'Something', body: 'Something', audience: 'parents' });

  check('an audience nobody defined is refused', !strangeAudience.success);
  check(
    'and the refusal carries its code',
    strangeAudience.success === false && strangeAudience.error.issues[0].message.startsWith(String(VALIDATION.AUDIENCE_INVALID.CODE)),
    strangeAudience.success === false ? strangeAudience.error.issues[0].message : ''
  );

  /*
    The author is the session, so there is no field for one. A payload naming somebody else
    parses — and the name is simply gone before any service sees it.
  */
  const impersonation = NoticeCreateSchema.parse({
    title: `${TEMP} impersonation attempt`,
    body: 'Published by somebody else, allegedly.',
    audience: NOTICE_AUDIENCES.ALL,
    publishedBy: student.userId,
    publishedAt: new Date('2000-01-01'),
  } as never);

  check('publishedBy is dropped by the schema', !('publishedBy' in impersonation));
  check('publishedAt is dropped too', !('publishedAt' in impersonation));

  await notices.create(impersonation, teacher);

  const attributed = await Notice.findOne({ title: `${TEMP} impersonation attempt` }).lean();

  check('the author is the session, not the payload', String(attributed?.publishedBy) === teacher.userId, String(attributed?.publishedBy));
  check('and the date is now, not the one supplied', (attributed?.publishedAt.getFullYear() ?? 0) > 2000, String(attributed?.publishedAt));

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
