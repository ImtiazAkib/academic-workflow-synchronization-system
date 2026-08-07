import mongoose from 'mongoose';

import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import { issueLoginId } from '@/lib/services';
import type { IssuableRole } from '@/lib/utils';

/*
  Brings accounts created before step 12 up to the shape step 12 assumes. Run once, after
  deploying it, with `npm run migrate:accounts`.

  Three things changed underneath existing rows, and every one of them is silent:

  1. `emailVerified` became a sign-in gate. A Mongoose `default` only applies to documents
     it creates, so every row written before this step has no such field — and an absent
     field is falsy, which means **every existing account is locked out**. That includes
     the administrator, so a deploy without this migration locks the department out of
     its own installation.

  2. Students and teachers now sign in with an issued `loginId`. Rows that predate it have
     none, and nothing else would ever give them one: identifiers are issued at email
     verification, and these accounts will never go through it.

  3. `studentId` was renamed to `roll`. Old rows still carry the old key, so the value is
     invisible to every screen that reads the new one.

  It is idempotent — each step matches only rows that still need it — so running it twice
  is harmless.
*/

let changed = 0;

function report(label: string, count: number): void {
  changed += count;
  console.log(`  ${count === 0 ? '—' : '✓'} ${label}: ${count}`);
}

async function run(): Promise<void> {
  await connectToDatabase();

  // The raw collection, deliberately: these keys no longer exist on the schema, and a
  // Mongoose query would strip them before Mongo ever saw them.
  const users = mongoose.connection.collection('users');

  console.log(`\nMigrating accounts in "${mongoose.connection.name}".\n`);

  /*
    Trusted rather than re-proven. Every one of these accounts was created by an
    administrator through the admin screens — self-registration did not exist yet — so an
    administrator vouching for them is the same verification a newly created account gets
    today.
  */
  const verified = await users.updateMany({ emailVerified: { $exists: false } }, { $set: { emailVerified: true } });

  report('accounts marked verified', verified.modifiedCount);

  const renamed = await users.updateMany({ studentId: { $exists: true } }, { $rename: { studentId: 'roll' } });

  report('studentId renamed to roll', renamed.modifiedCount);

  /*
    One at a time, and re-reading the count each time, because `issueLoginId` derives the
    next sequence from how many are already issued. A bulk write would hand every row the
    same number and let the unique index reject all but one.
  */
  const needsId = await users.find({ role: { $in: [USER_ROLES.STUDENT, USER_ROLES.TEACHER] }, loginId: { $exists: false } }).toArray();

  let issued = 0;

  for (const account of needsId) {
    const loginId = await issueLoginId(account.role as IssuableRole);

    if (!loginId) {
      console.log(`  ! could not issue an identifier for ${String(account.email)}`);
      continue;
    }

    await users.updateOne({ _id: account._id }, { $set: { loginId } });
    console.log(`    ${String(account.email)} → ${loginId}`);
    issued++;
  }

  report('identifiers issued', issued);

  console.log(
    changed === 0
      ? '\nNothing to migrate — these accounts are already in the step 12 shape.'
      : '\nDone. Tell anyone issued an identifier above what it is: they sign in with it, not their email.'
  );

  await mongoose.disconnect();
}

run().catch(async error => {
  console.error('migration failed:', error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
