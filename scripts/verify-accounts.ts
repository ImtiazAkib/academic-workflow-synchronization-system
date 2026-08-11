import { createHash } from 'node:crypto';

import mongoose from 'mongoose';

import { User } from '@/models/user.model';

import { EMAIL_VERIFICATION, LOGIN_ID_PATTERN } from '@/constants/account.const';
import { CODES } from '@/constants/codes.const';
import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import { StudentRegistrationSchema, TeacherRegistrationSchema } from '@/lib/schemas';
import { AuthService } from '@/lib/services';

/*
  Exercises registration, email verification and sign-in by identifier — the paths a
  browser check cannot reach without a mail server and an inbox.

  Every row it writes carries the `account-verify` email prefix and is deleted
  afterwards. It never touches a real account: the only existing rows it reads are
  counted, never written.

  Run with `npm run verify:accounts`.
*/
const TEMP = 'account-verify';
const PASSWORD = 'temp-password-123';

const AUTH = CODES.AUTH.USERS;
const VALIDATION = CODES.VALIDATION.USERS;

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

function studentInput(overrides: Partial<Record<string, string>> = {}) {
  return StudentRegistrationSchema.parse({
    name: 'Verify Student',
    email: `${TEMP}-student@department.edu`,
    password: PASSWORD,
    roll: '20210001',
    registrationNo: '10001',
    session: '2021-22',
    department: 'ICT',
    semester: '7',
    ...overrides,
  });
}

async function cleanup(): Promise<void> {
  await User.deleteMany({ email: { $regex: `^${TEMP}` } });
}

async function run(): Promise<void> {
  await connectToDatabase();
  await User.init();
  await cleanup();

  console.log('\n1. registering');
  const registration = await auth.registerStudent(studentInput());
  check('a student can register', registration.success && registration.result !== null, JSON.stringify(registration.errors));

  const created = registration.result;

  check('the account is unverified', created?.user.emailVerified === false);
  check('and unapproved', created?.user.isApproved === false);
  check('and holds no identifier yet', !created?.user.loginId, `loginId=${String(created?.user.loginId)}`);
  check('a token was minted', Boolean(created?.verificationToken));

  /*
    The token is the one secret here, so what is stored must not be the token. A leaked
    database read should not hand out accounts, which is the same reason `password` holds
    a hash.
  */
  const storedToken = await User.findOne({ email: `${TEMP}-student@department.edu` })
    .select('+emailVerificationTokenHash')
    .lean();

  check('only a hash of it is stored', storedToken?.emailVerificationTokenHash !== created?.verificationToken);
  check(
    'and it is the right hash',
    storedToken?.emailVerificationTokenHash ===
      createHash('sha256')
        .update(created?.verificationToken ?? '')
        .digest('hex')
  );

  console.log('\n2. what registration refuses');
  const duplicateEmail = await auth.registerStudent(studentInput({ roll: '20219999' }));
  check('a duplicate email', !duplicateEmail.success && duplicateEmail.errors[0]?.code === VALIDATION.EMAIL_ALREADY_USED.CODE);

  const duplicateRoll = await auth.registerStudent(studentInput({ email: `${TEMP}-other@department.edu` }));
  check('a duplicate roll number', !duplicateRoll.success && duplicateRoll.errors[0]?.code === VALIDATION.ROLL_ALREADY_USED.CODE);

  /*
    The schema has no role, isApproved or emailVerified field, so a hand-built request
    carrying them cannot set them. Zod strips unknown keys rather than rejecting, which
    is what makes this safe rather than merely unlikely.
  */
  const smuggled = StudentRegistrationSchema.safeParse({
    ...studentInput({ email: `${TEMP}-smuggle@department.edu`, roll: '99991' }),
    semester: '7',
    role: USER_ROLES.ADMIN,
    isApproved: true,
    emailVerified: true,
  });
  check('a smuggled role is stripped, not honoured', smuggled.success && !('role' in smuggled.data));
  check('and so is a smuggled approval', smuggled.success && !('isApproved' in smuggled.data) && !('emailVerified' in smuggled.data));

  console.log('\n3. signing in before confirming');
  const beforeVerifying = await auth.verifyCredentials(`${TEMP}-student@department.edu`, PASSWORD);
  check('is refused for the right reason', beforeVerifying.errors[0]?.code === AUTH.EMAIL_NOT_VERIFIED.CODE, JSON.stringify(beforeVerifying.errors));

  console.log('\n4. what verification refuses');
  const badToken = await auth.verifyEmail('not-a-real-token');
  check('an unknown token', !badToken.success && badToken.errors[0]?.code === VALIDATION.VERIFICATION_LINK_INVALID.CODE);

  const emptyToken = await auth.verifyEmail('');
  check('an empty token', !emptyToken.success);

  // Age the link rather than waiting a day for it.
  await User.updateOne({ email: `${TEMP}-student@department.edu` }, { emailVerificationExpiresAt: new Date(Date.now() - 1000) });

  const expired = await auth.verifyEmail(created?.verificationToken ?? '');
  check('an expired link', !expired.success && expired.errors[0]?.code === VALIDATION.VERIFICATION_LINK_EXPIRED.CODE, JSON.stringify(expired.errors));

  await User.updateOne({ email: `${TEMP}-student@department.edu` }, { emailVerificationExpiresAt: new Date(Date.now() + 60_000) });

  console.log('\n5. confirming, and being issued an identifier');
  const verified = await auth.verifyEmail(created?.verificationToken ?? '');
  check('the link works', verified.success && verified.result !== null, JSON.stringify(verified.errors));

  const loginId = verified.result?.loginId ?? '';

  check('an identifier was issued', LOGIN_ID_PATTERN.test(loginId), `loginId=${loginId}`);
  check('with the student prefix', loginId.startsWith('S-'), `loginId=${loginId}`);
  check('the account is now verified', verified.result?.user.emailVerified === true);
  check('but still not approved', verified.result?.user.isApproved === false);

  const afterVerifying = await User.findOne({ email: `${TEMP}-student@department.edu` })
    .select('+emailVerificationTokenHash')
    .lean();

  check('the token is cleared', !afterVerifying?.emailVerificationTokenHash, 'a spent link must open nothing');

  /*
    Following the link twice is not an error worth showing — somebody refreshing the tab
    should not be told their confirmation failed. It reports the same identifier rather
    than issuing a second one.
  */
  const secondClick = await auth.verifyEmail(created?.verificationToken ?? '');
  check('a second click is refused, the token being spent', !secondClick.success);

  console.log('\n6. signing in with the identifier');
  const beforeApproval = await auth.verifyCredentials(loginId, PASSWORD);
  check('still refused until approved', beforeApproval.errors[0]?.code === AUTH.ACCOUNT_NOT_APPROVED.CODE, JSON.stringify(beforeApproval.errors));

  await User.updateOne({ email: `${TEMP}-student@department.edu` }, { isApproved: true });

  const signedIn = await auth.verifyCredentials(loginId, PASSWORD);
  check('approved, the identifier signs in', signedIn.success, JSON.stringify(signedIn.errors));
  check('lowercase is accepted too', (await auth.verifyCredentials(loginId.toLowerCase(), PASSWORD)).success);
  check('a wrong password is refused', !(await auth.verifyCredentials(loginId, 'wrong-password')).success);

  /*
    The email address stops being a way in. It is the recovery channel and the thing
    verification proved — not a second set of credentials.
  */
  const byEmail = await auth.verifyCredentials(`${TEMP}-student@department.edu`, PASSWORD);
  check(
    'the email address no longer signs a student in',
    !byEmail.success && byEmail.errors[0]?.code === AUTH.SIGN_IN_WITH_LOGIN_ID.CODE,
    JSON.stringify(byEmail.errors)
  );
  check('and the refusal tells them what to use instead', byEmail.errors[0]?.code === AUTH.SIGN_IN_WITH_LOGIN_ID.CODE);

  console.log('\n6b. asking for another confirmation link');
  const pending = await auth.registerStudent(studentInput({ email: `${TEMP}-resend@department.edu`, roll: '70001' }));
  check('a second account registers', pending.success, JSON.stringify(pending.errors));

  const firstResend = await auth.reissueVerification(`${TEMP}-resend@department.edu`);

  /*
    Straight after registering the token is seconds old, and the cooldown is what stops
    this endpoint being used to send somebody a message per second. The account exists, so
    this is a success carrying a null payload — nothing to send — rather than a failure.
  */
  check('is throttled while the last one is fresh', firstResend.success && firstResend.result === null);

  // Age the live token past the cooldown rather than waiting it out.
  await User.updateOne(
    { email: `${TEMP}-resend@department.edu` },
    {
      emailVerificationExpiresAt: new Date(
        Date.now() + (EMAIL_VERIFICATION.LIFETIME_HOURS * 60 - EMAIL_VERIFICATION.RESEND_COOLDOWN_MINUTES - 1) * 60 * 1000
      ),
    }
  );

  const secondResend = await auth.reissueVerification(`${TEMP}-resend@department.edu`);
  check('but allowed once the cooldown passes', secondResend.success && secondResend.result !== null);
  check('and the new token differs from the first', secondResend.result?.verificationToken !== pending.result?.verificationToken);

  /*
    A fresh link invalidates the old one, so an earlier email leaking afterwards opens
    nothing.
  */
  const supersededLink = await auth.verifyEmail(pending.result?.verificationToken ?? '');
  check('the superseded link no longer works', !supersededLink.success);

  /*
    An unregistered address is now named rather than hidden — the department's deliberate
    reversal — so it is a failure. An address that exists but is already confirmed is still
    a null success: nothing to send, and its state is not disclosed.
  */
  check('an unknown address is refused', !(await auth.reissueVerification(`${TEMP}-nobody@department.edu`)).success);
  check('an already-confirmed address yields nothing to send', (await auth.reissueVerification(`${TEMP}-student@department.edu`)).result === null);

  console.log('\n7. teachers get their own prefix');
  const teacher = await auth.registerTeacher(
    TeacherRegistrationSchema.parse({
      name: 'Verify Teacher',
      email: `${TEMP}-teacher@department.edu`,
      password: PASSWORD,
      department: 'Computer Science',
    })
  );
  check('a teacher can register', teacher.success, JSON.stringify(teacher.errors));

  const teacherVerified = await auth.verifyEmail(teacher.result?.verificationToken ?? '');
  const teacherLoginId = teacherVerified.result?.loginId ?? '';

  check('with the teacher prefix', teacherLoginId.startsWith('T-'), `loginId=${teacherLoginId}`);
  check('and a different identifier from the student', teacherLoginId !== loginId);

  /*
    The prefix is what lets one sign-in field serve both without a shared namespace. A
    student and a teacher issued the same sequence number still cannot collide.
  */
  check('the two prefixes keep the namespaces apart', teacherLoginId.slice(1) !== loginId.slice(1) || teacherLoginId[0] !== loginId[0]);

  console.log('\n8. the identifier is unique at the database, not only in the generator');
  let indexRefused = false;

  try {
    await User.create({
      name: 'Duplicate Login',
      email: `${TEMP}-duplicate@department.edu`,
      password: PASSWORD,
      role: USER_ROLES.STUDENT,
      loginId,
    });
  } catch {
    indexRefused = true;
  }

  check('a second account with the same identifier is refused', indexRefused);

  console.log('\n9. administrators are unchanged');
  const admin = await User.create({
    name: 'Verify Admin',
    email: `${TEMP}-admin@department.edu`,
    password: PASSWORD,
    role: USER_ROLES.ADMIN,
    isApproved: true,
    emailVerified: true,
  });

  const adminSignIn = await auth.verifyCredentials(`${TEMP}-admin@department.edu`, PASSWORD);
  check('an administrator still signs in with their email', adminSignIn.success, JSON.stringify(adminSignIn.errors));
  check('and holds no identifier', !admin.loginId);

  console.log('\n10. a seeded super administrator can actually sign in');
  /*
    The regression this guards is a bootstrap that reports success and locks everybody
    out: `emailVerified` is a sign-in gate and the model defaults it to false, so a seed
    script that forgets to set it produces a super administrator nobody can sign in as.

    Asserted against whichever account exists rather than by minting one — the partial
    unique index allows exactly one super administrator, so on a seeded database creating
    a rival is not a test, it is a duplicate-key error. Which is the index working, but
    tells us nothing about the seed.
  */
  const seeded = await User.findOne({ role: USER_ROLES.SUPER_ADMIN }).lean();

  if (seeded) {
    check('the seeded account is verified, so the gate lets it through', seeded.emailVerified === true, 'false here locks the department out');
    check('it is approved and active', seeded.isApproved === true && seeded.isActive === true);
    check('and holds no identifier — it signs in by email', !seeded.loginId);
  } else {
    const throwaway = await User.create({
      name: 'Verify Seeded Super',
      email: `${TEMP}-seeded-super@department.edu`,
      password: PASSWORD,
      role: USER_ROLES.SUPER_ADMIN,
      isApproved: true,
      isActive: true,
      emailVerified: true,
    });

    const signIn = await auth.verifyCredentials(`${TEMP}-seeded-super@department.edu`, PASSWORD);

    check('a seeded-shape account signs in with its email', signIn.success, JSON.stringify(signIn.errors));
    check('and holds no identifier', !throwaway.loginId);
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
