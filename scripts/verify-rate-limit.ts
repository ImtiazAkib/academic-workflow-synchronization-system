import mongoose from 'mongoose';

import { RateLimit } from '@/models/rate-limit.model';
import { User } from '@/models/user.model';

import { RATE_LIMIT } from '@/constants/rate-limit.const';
import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';
import { AuthService, consumeRateLimit, hashToken, resetRateLimit } from '@/lib/services';

/*
  Exercises the limiter itself and the one endpoint that uses it from inside a service.

  It never sleeps. A window is a wall-clock span, so the only honest way to test the far
  side of one is to move the row's own `windowStartedAt` backwards and ask again — the
  same trick `verify-accounts.ts` uses on the resend cooldown, and the reason that suite
  runs in a second rather than in two minutes.

  Every key it writes carries the `rate-verify` scope and every account the `rate-verify`
  email prefix; both are deleted afterwards.

  Run with `npm run verify:rate-limit`.
*/
const TEMP = 'rate-verify';
const PASSWORD = 'temp-password-123';

const SMALL = { LIMIT: 3, WINDOW_MINUTES: 15 };

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

/**
 * Move a key's window into the past, so the next call sees a closed one.
 *
 * @param scope - Budget the key belongs to.
 * @param identity - The identity as it was passed to the guard.
 * @param minutes - How far back to move it.
 */
async function ageWindow(scope: string, identity: string, minutes: number): Promise<void> {
  const key = `${scope}:${hashToken(identity.trim().toLowerCase())}`;
  const movedTo = new Date(Date.now() - minutes * 60 * 1000);

  await RateLimit.updateOne({ key }, { windowStartedAt: movedTo });
}

async function cleanup(): Promise<void> {
  await RateLimit.deleteMany({ key: { $regex: `^${TEMP}` } });
  await User.deleteMany({ email: { $regex: `^${TEMP}` } });
}

async function run(): Promise<void> {
  await connectToDatabase();
  await RateLimit.init();
  await User.init();
  await cleanup();

  console.log('\n1. a budget is spent, then refills');

  const results: boolean[] = [];

  for (let attempt = 0; attempt < SMALL.LIMIT; attempt++) {
    results.push(await consumeRateLimit(`${TEMP}-basic`, 'someone', SMALL));
  }

  check('every attempt inside the budget is allowed', results.every(Boolean), JSON.stringify(results));

  const overBudget = await consumeRateLimit(`${TEMP}-basic`, 'someone', SMALL);

  check('the one past it is refused', !overBudget);

  const stillRefused = await consumeRateLimit(`${TEMP}-basic`, 'someone', SMALL);

  check('and so is the next', !stillRefused);

  await ageWindow(`${TEMP}-basic`, 'someone', SMALL.WINDOW_MINUTES + 1);

  check('once the window closes, the allowance is back', await consumeRateLimit(`${TEMP}-basic`, 'someone', SMALL));

  console.log('\n2. keys and scopes do not bleed into each other');

  for (let attempt = 0; attempt <= SMALL.LIMIT; attempt++) {
    await consumeRateLimit(`${TEMP}-scoped`, 'noisy', SMALL);
  }

  check('the noisy identity is spent', !(await consumeRateLimit(`${TEMP}-scoped`, 'noisy', SMALL)));
  check('a different identity is untouched', await consumeRateLimit(`${TEMP}-scoped`, 'quiet', SMALL));
  /*
    Somebody who has used up their registration attempts has not thereby used up their
    sign-in attempts. The scope prefix is what keeps those apart.
  */
  check('and the same identity under another scope is untouched', await consumeRateLimit(`${TEMP}-other`, 'noisy', SMALL));

  console.log('\n3. the stored row gives nothing away');

  const stored = await RateLimit.findOne({ key: { $regex: `^${TEMP}-scoped` } }).lean();

  check('a row exists for the key', Boolean(stored));
  check('it carries an expiry for the TTL sweep', stored?.expiresAt instanceof Date);
  /*
    Identities are addresses, login IDs and network addresses — all personal data with
    their own retention story. This collection only ever asks "have I seen this exact key
    before", which a digest answers as well as the value.
  */
  check('the identity is stored hashed, never raw', !String(stored?.key).includes('noisy'), String(stored?.key));

  console.log('\n4. clearing a key restores the allowance');

  for (let attempt = 0; attempt <= SMALL.LIMIT; attempt++) {
    await consumeRateLimit(`${TEMP}-clear`, 'forgiven', SMALL);
  }

  check('the identity is spent', !(await consumeRateLimit(`${TEMP}-clear`, 'forgiven', SMALL)));

  await resetRateLimit(`${TEMP}-clear`, 'forgiven');

  check('and a reset gives it back', await consumeRateLimit(`${TEMP}-clear`, 'forgiven', SMALL));

  console.log('\n5. sign-in counts failures, not attempts');

  await User.create({
    name: 'Verify Rate',
    email: `${TEMP}-admin@department.edu`,
    password: PASSWORD,
    role: USER_ROLES.ADMIN,
    emailVerified: true,
    isApproved: true,
    isActive: true,
  });

  const identifier = `${TEMP}-admin@department.edu`;

  await resetRateLimit('sign-in', identifier);

  const wrong: number[] = [];

  for (let attempt = 0; attempt < RATE_LIMIT.SIGN_IN.LIMIT; attempt++) {
    const result = await auth.verifyCredentials(identifier, 'not-the-password');

    wrong.push(result.errors[0]?.code ?? 0);
  }

  check(
    'every wrong password inside the budget is refused as wrong',
    wrong.every(code => code === 51000),
    JSON.stringify(wrong)
  );

  const throttled = await auth.verifyCredentials(identifier, 'not-the-password');

  check('the attempt past the budget is throttled instead', throttled.errors[0]?.code === 30002, JSON.stringify(throttled.errors));

  /*
    The point of counting failures rather than attempts: the throttle must not lock out
    somebody who then remembers their password. Ageing the window is what a real person
    waiting would experience.
  */
  await ageWindow('sign-in', identifier, RATE_LIMIT.SIGN_IN.WINDOW_MINUTES + 1);

  const good = await auth.verifyCredentials(identifier, PASSWORD);

  check('after the window, the right password works', good.success, JSON.stringify(good.errors));

  const afterSuccess = await RateLimit.findOne({ key: `sign-in:${hashToken(identifier.trim().toLowerCase())}` }).lean();

  check('and a success clears the record entirely', !afterSuccess, JSON.stringify(afterSuccess));

  console.log('\n6. an unknown identifier throttles exactly like a real one');

  const ghost = `${TEMP}-nobody@department.edu`;

  await resetRateLimit('sign-in', ghost);

  for (let attempt = 0; attempt < RATE_LIMIT.SIGN_IN.LIMIT; attempt++) {
    await auth.verifyCredentials(ghost, 'whatever');
  }

  const ghostThrottled = await auth.verifyCredentials(ghost, 'whatever');

  /*
    The refusal must not become an oracle. If only real accounts were counted, the
    difference between "wrong password" and "too many attempts" would answer the question
    the shared invalid-credentials message exists to refuse.
  */
  check('an address nobody owns is throttled too', ghostThrottled.errors[0]?.code === 30002, JSON.stringify(ghostThrottled.errors));

  await resetRateLimit('sign-in', ghost);
  await resetRateLimit('sign-in', identifier);
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
