import mongoose from 'mongoose';

import { Course } from '@/models/course.model';
import { Material } from '@/models/material.model';
import { User } from '@/models/user.model';
import { SessionUser } from '@/types';

import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import { MaterialUploadSchema } from '@/lib/schemas';
import { MaterialService } from '@/lib/services';
import { storage } from '@/lib/storage';

/*
  Exercises the materials layer end to end against the real database — the GridFS
  round-trip, the magic-byte check and the three authorization rules. Everything it
  creates is prefixed so cleanup is exact. Run with `npm run verify:materials`.
*/
const TEMP = 'materials-verify';
const TEMP_CODE_PREFIX = '^ZZM';

const materials = new MaterialService();

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

/** A byte-valid PDF: the %PDF magic number followed by filler. */
function makePdf(name: string, bytes = 2048): File {
  const body = new Uint8Array(bytes);
  body.set([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);

  return new File([body], name, { type: 'application/pdf' });
}

async function cleanup(): Promise<void> {
  const owned = await Course.find({ code: { $regex: TEMP_CODE_PREFIX } }).lean();
  const rows = await Material.find({ course: { $in: owned.map(x => x._id) } }).lean();

  for (const row of rows) {
    await storage.remove(row.storageKey);
  }

  await Material.deleteMany({ course: { $in: owned.map(x => x._id) } });
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

  const ownCourse = await Course.create({ code: 'ZZM-101', title: 'Owned', semester: 1, credits: 3, assignedTeacher: teacherA._id });
  const otherCourse = await Course.create({ code: 'ZZM-102', title: 'Not owned', semester: 1, credits: 3, assignedTeacher: teacherB._id });

  const asTeacherA: SessionUser = {
    userId: String(teacherA._id),
    email: teacherA.email,
    name: teacherA.name,
    role: USER_ROLES.TEACHER,
    isApproved: true,
  };
  const asTeacherB: SessionUser = {
    userId: String(teacherB._id),
    email: teacherB.email,
    name: teacherB.name,
    role: USER_ROLES.TEACHER,
    isApproved: true,
  };

  console.log('\n1. schema validation');
  const noFile = MaterialUploadSchema.safeParse({
    courseId: String(ownCourse._id),
    title: 'x',
    file: new File([], 'empty.pdf', { type: 'application/pdf' }),
  });
  check('rejects an empty file', !noFile.success);

  const badType = MaterialUploadSchema.safeParse({
    courseId: String(ownCourse._id),
    title: 'x',
    file: new File([new Uint8Array(16)], 'evil.exe', { type: 'application/octet-stream' }),
  });
  check('rejects a disallowed type', !badType.success);

  const tooBig = MaterialUploadSchema.safeParse({
    courseId: String(ownCourse._id),
    title: 'x',
    file: new File([new Uint8Array(26 * 1024 * 1024)], 'huge.pdf', { type: 'application/pdf' }),
  });
  check('rejects a file over the cap', !tooBig.success);

  console.log('\n2. magic bytes');
  const mislabelled = await materials.upload(
    {
      courseId: String(ownCourse._id),
      title: 'Mislabelled',
      file: new File([new TextEncoder().encode('<html>hi</html>')], 'notes.pdf', { type: 'application/pdf' }),
    },
    asTeacherA
  );
  check('refuses HTML wearing a .pdf name and type', !mislabelled.success, JSON.stringify(mislabelled.errors));

  console.log('\n3. upload and round-trip');
  const uploaded = await materials.upload({ courseId: String(ownCourse._id), title: 'Week 1 slides', file: makePdf('week-1.pdf') }, asTeacherA);
  check('uploads to an owned course', uploaded.success, JSON.stringify(uploaded.errors));
  check('records the size', uploaded.result?.size === 2048, `size=${uploaded.result?.size}`);

  const materialId = uploaded.result?.materialId ?? '';

  const opened = await materials.openForDownload(materialId, asTeacherA);
  check('reads the file back', opened.success && opened.result !== null);

  if (opened.result) {
    const chunks: Uint8Array[] = [];
    const reader = opened.result.stream.getReader();

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const total = chunks.reduce((sum, x) => sum + x.length, 0);
    check('bytes survive the round-trip', total === 2048, `got ${total}`);
    check('mime type survives', opened.result.mimeType === 'application/pdf', opened.result.mimeType);
  }

  console.log('\n4. authorization');
  const foreignCourse = await materials.upload({ courseId: String(otherCourse._id), title: 'Sneaky', file: makePdf('sneak.pdf') }, asTeacherA);
  check("refuses upload to another teacher's course", !foreignCourse.success, JSON.stringify(foreignCourse.errors));

  const foreignDelete = await materials.remove(materialId, asTeacherB);
  check("refuses delete of another teacher's file", !foreignDelete.success, JSON.stringify(foreignDelete.errors));

  const anonymous = await materials.openForDownload(materialId, null);
  check('refuses download with no session', !anonymous.success);

  console.log('\n5. delete');
  const removed = await materials.remove(materialId, asTeacherA);
  check('owner deletes their file', removed.success, JSON.stringify(removed.errors));

  const afterDelete = await materials.openForDownload(materialId, asTeacherA);
  check('the file is gone afterwards', !afterDelete.success);

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
