import mongoose from 'mongoose';

import { Notice } from '@/models/notice.model';
import { User } from '@/models/user.model';

import { CODES } from '@/constants/codes.const';
import { NOTICE_AUDIENCES, NOTICE_CATEGORIES, NOTICE_IMAGE } from '@/constants/notice.const';
import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import { NoticeCreateSchema } from '@/lib/schemas';
import { NoticeService } from '@/lib/services';
import { storage } from '@/lib/storage';

import type { NoticeEntity } from '@/models/notice.model';
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
const AUTH = CODES.AUTH.NOTICES;

/** A real 1x1 PNG, so the magic-byte check in the service sees what it expects. */
const PNG_BYTES = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

/**
 * A file the schema and the signature check will both accept.
 *
 * @param name - File name, which the extension check reads.
 *
 * @returns An uploadable image.
 */
function pngFile(name = 'circular.png'): File {
  return new File([PNG_BYTES as BlobPart], name, { type: 'image/png' });
}

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

  const result = await notices.create(
    NoticeCreateSchema.parse({ title, body: `Body of the ${audience} notice.`, audience, category: NOTICE_CATEGORIES.GENERAL }),
    requester
  );

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
  /*
    The bytes go before the rows that point at them. Deleting only the notices would leave
    the images orphaned in the bucket with nothing referencing them and no way to find them
    again — this suite promises to leave the database as it found it, and a GridFS file is
    part of the database.
  */
  const seeded = await Notice.find({ title: { $regex: `^${TEMP}` } }).lean<NoticeEntity[]>();
  const keys = seeded.flatMap(x => (x.image ? [x.image.storageKey] : []));

  await Promise.all(keys.map(key => storage.remove(key)));

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

  const limited = await notices.listForRole(USER_ROLES.ADMIN, null, 1);

  check('a limit is applied', limited.result.length === 1, String(limited.result.length));

  const unlimited = await notices.listForRole(USER_ROLES.ADMIN, null, null);

  check('and null means every one of them', unlimited.result.length >= 3, String(unlimited.result.length));

  console.log('\n6. what the schema refuses');

  const blankTitle = NoticeCreateSchema.safeParse({
    title: '   ',
    body: 'Something',
    audience: NOTICE_AUDIENCES.ALL,
    category: NOTICE_CATEGORIES.GENERAL,
  });

  check('a blank title is refused', !blankTitle.success);

  const blankBody = NoticeCreateSchema.safeParse({
    title: 'Something',
    body: '',
    audience: NOTICE_AUDIENCES.ALL,
    category: NOTICE_CATEGORIES.GENERAL,
  });

  check('an empty announcement is refused', !blankBody.success);

  const strangeAudience = NoticeCreateSchema.safeParse({
    title: 'Something',
    body: 'Something',
    audience: 'parents',
    category: NOTICE_CATEGORIES.GENERAL,
  });

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
    category: NOTICE_CATEGORIES.GENERAL,
    publishedBy: student.userId,
    publishedAt: new Date('2000-01-01'),
  } as never);

  check('publishedBy is dropped by the schema', !('publishedBy' in impersonation));
  check('publishedAt is dropped too', !('publishedAt' in impersonation));

  await notices.create(impersonation, teacher);

  const attributed = await Notice.findOne({ title: `${TEMP} impersonation attempt` }).lean();

  check('the author is the session, not the payload', String(attributed?.publishedBy) === teacher.userId, String(attributed?.publishedBy));
  check('and the date is now, not the one supplied', (attributed?.publishedAt.getFullYear() ?? 0) > 2000, String(attributed?.publishedAt));

  console.log('\n7. a picture, words, or both');

  const withImage = await notices.create(
    NoticeCreateSchema.parse({
      title: `${TEMP} with a picture`,
      body: 'Both halves.',
      audience: NOTICE_AUDIENCES.ALL,
      category: NOTICE_CATEGORIES.GENERAL,
      image: pngFile(),
    }),
    admin
  );

  check('a notice publishes with an image', withImage.success, JSON.stringify(withImage.errors));
  check('and reports that it has one', withImage.result?.hasImage === true);

  const imageOnly = await notices.create(
    NoticeCreateSchema.parse({
      title: `${TEMP} picture only`,
      audience: NOTICE_AUDIENCES.STUDENTS,
      category: NOTICE_CATEGORIES.GENERAL,
      image: pngFile('routine.png'),
    }),
    admin
  );

  check('a picture with no words is a notice', imageOnly.success, JSON.stringify(imageOnly.errors));
  check('and its body reads as empty', imageOnly.result?.body === '');

  const textOnly = await notices.create(
    NoticeCreateSchema.parse({
      title: `${TEMP} words only`,
      body: 'No picture here.',
      audience: NOTICE_AUDIENCES.ALL,
      category: NOTICE_CATEGORIES.GENERAL,
    }),
    admin
  );

  check('words with no picture are still a notice', textOnly.success, JSON.stringify(textOnly.errors));
  check('and it reports no image', textOnly.result?.hasImage === false);

  const neither = NoticeCreateSchema.safeParse({
    title: `${TEMP} nothing`,
    body: '',
    audience: NOTICE_AUDIENCES.ALL,
    category: NOTICE_CATEGORIES.GENERAL,
  });

  check('neither words nor picture is refused', !neither.success);
  check(
    'and the refusal lands on the body field',
    neither.success === false && neither.error.issues[0].path[0] === 'body',
    neither.success === false ? JSON.stringify(neither.error.issues[0].path) : ''
  );

  const storedImage = await Notice.findOne({ title: `${TEMP} picture only` }).lean();

  check('the storage key is kept on the row', Boolean(storedImage?.image?.storageKey));
  check('with the type and size beside it', storedImage?.image?.mimeType === 'image/png' && (storedImage?.image?.size ?? 0) > 0);
  /*
    The DTO is the only route a notice takes to a screen, and it must not carry the key —
    publishing it would put the bucket one guess away from anybody.
  */
  check(
    'but the DTO never carries it',
    !JSON.stringify(imageOnly.result).includes(storedImage?.image?.storageKey ?? 'no-key'),
    JSON.stringify(imageOnly.result)
  );

  console.log('\n8. what the picker refuses');

  const tooBig = NoticeCreateSchema.safeParse({
    title: `${TEMP} huge`,
    audience: NOTICE_AUDIENCES.ALL,
    category: NOTICE_CATEGORIES.GENERAL,
    image: new File([new Uint8Array(NOTICE_IMAGE.MAX_SIZE_BYTES + 1) as BlobPart], 'huge.png', { type: 'image/png' }),
  });

  check('an oversized image is refused', !tooBig.success);
  check(
    'as too large, rather than as the wrong type',
    tooBig.success === false && tooBig.error.issues[0].message.startsWith(String(VALIDATION.IMAGE_TOO_LARGE.CODE)),
    tooBig.success === false ? tooBig.error.issues[0].message : ''
  );

  const wrongType = NoticeCreateSchema.safeParse({
    title: `${TEMP} pdf`,
    audience: NOTICE_AUDIENCES.ALL,
    category: NOTICE_CATEGORIES.GENERAL,
    image: new File([PNG_BYTES as BlobPart], 'circular.pdf', { type: 'application/pdf' }),
  });

  check('a document posing as an image is refused', !wrongType.success);

  /*
    Refused by the type list, and that is load-bearing rather than fussiness: a notice
    image is served inline, and an SVG is a document that can carry script.
  */
  const svg = NoticeCreateSchema.safeParse({
    title: `${TEMP} svg`,
    audience: NOTICE_AUDIENCES.ALL,
    category: NOTICE_CATEGORIES.GENERAL,
    image: new File(['<svg></svg>' as BlobPart], 'logo.svg', { type: 'image/svg+xml' }),
  });

  check('an SVG is refused, because images render inline', !svg.success);

  /*
    Declared type and extension both say PNG; the bytes say otherwise. Only the magic-byte
    check in the service catches this, so it is asserted past a schema that accepted it.
  */
  const mislabelled = NoticeCreateSchema.safeParse({
    title: `${TEMP} mislabelled`,
    audience: NOTICE_AUDIENCES.ALL,
    category: NOTICE_CATEGORIES.GENERAL,
    image: new File(['MZ this is not a picture' as BlobPart], 'payload.png', { type: 'image/png' }),
  });

  check('a mislabelled file passes the schema', mislabelled.success);

  const liar = mislabelled.success ? await notices.create(mislabelled.data, admin) : null;

  check('but the service reads its first bytes and refuses it', liar !== null && !liar.success);
  check('as the wrong type', liar?.errors[0]?.code === VALIDATION.IMAGE_TYPE_NOT_ALLOWED.CODE, JSON.stringify(liar?.errors));

  console.log('\n9. the image is behind the audience, not merely unlinked');

  const studentsOnlyId = imageOnly.result?.noticeId ?? '';

  const asStudent = await notices.openImage(studentsOnlyId, student);

  check('a student opens the image addressed to students', asStudent.success, JSON.stringify(asStudent.errors));
  check('and gets the bytes with their type', asStudent.result?.mimeType === 'image/png');

  /*
    The check this route exists for. The feed already never lists this notice to a teacher
    — but the URL carries an id, and an id can be guessed.
  */
  const asTeacher = await notices.openImage(studentsOnlyId, teacher);

  check('a teacher guessing the id is refused', !asTeacher.success);
  check('as not being in the audience', asTeacher.errors[0]?.code === AUTH.NOT_IN_AUDIENCE.CODE, JSON.stringify(asTeacher.errors));

  const asNobody = await notices.openImage(studentsOnlyId, null);

  check('a signed-out request is refused', !asNobody.success);

  const asAdmin = await notices.openImage(studentsOnlyId, admin);

  check('an administrator may open any of them', asAdmin.success, JSON.stringify(asAdmin.errors));

  const noImage = await notices.openImage(textOnly.result?.noticeId ?? '', admin);

  check('a notice with no picture has none to open', !noImage.success);
  check('reported as not found', noImage.errors[0]?.code === VALIDATION.NOTICE_NOT_FOUND.CODE, JSON.stringify(noImage.errors));

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
