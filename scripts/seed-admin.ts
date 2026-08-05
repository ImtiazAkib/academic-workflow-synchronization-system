import mongoose from 'mongoose';
import { z } from 'zod';

import { User } from '@/models/user.model';

import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';

/*
  Creates the first administrator, which is the only account that cannot be created
  through the UI — every other account is created by an administrator who is already
  signed in.

  Run it with the credentials in the environment rather than on the command line, so
  the password does not end up in shell history:

    SEED_ADMIN_NAME="Department Head" \
    SEED_ADMIN_EMAIL="head@department.edu" \
    SEED_ADMIN_PASSWORD="..." \
    npm run seed:admin

  These three are read straight from `process.env` and validated here rather than
  declared in `env/server.ts`. They are inputs to a one-off script, not application
  configuration, and requiring them at build time would be wrong.
*/
const SeedAdminSchema = z.object({
  SEED_ADMIN_NAME: z.string().trim().min(1, 'SEED_ADMIN_NAME is required'),
  SEED_ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email('SEED_ADMIN_EMAIL must be a valid email address')),
  SEED_ADMIN_PASSWORD: z.string().min(8, 'SEED_ADMIN_PASSWORD must be at least 8 characters'),
});

async function seedAdmin(): Promise<void> {
  const parsed = SeedAdminSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Cannot seed the administrator:');
    // Zod's own "required" message wins over a custom one, so the path is what
    // actually tells you which variable is missing.
    parsed.error.issues.forEach(issue => console.error(`  - ${issue.path.join('.') || 'input'}: ${issue.message}`));
    console.error('\nSet SEED_ADMIN_NAME, SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD, then run again.');
    process.exitCode = 1;
    return;
  }

  const { SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = parsed.data;

  await connectToDatabase();
  console.log(`Connected to "${mongoose.connection.name}".`);

  const existing = await User.findOne({ email: SEED_ADMIN_EMAIL });

  if (existing) {
    // Idempotent on purpose: re-running must never silently reset a password.
    console.log(`An account already exists for ${SEED_ADMIN_EMAIL} — nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  const administrator = await User.create({
    name: SEED_ADMIN_NAME,
    email: SEED_ADMIN_EMAIL,
    // Hashed by the model's pre-save hook, never here.
    password: SEED_ADMIN_PASSWORD,
    role: USER_ROLES.ADMIN,
    isApproved: true,
    isActive: true,
  });

  const adminCount = await User.countDocuments({ role: USER_ROLES.ADMIN });

  console.log(`Created administrator ${administrator.email} (${String(administrator._id)}).`);
  console.log(`The department now has ${adminCount} administrator(s).`);

  await mongoose.disconnect();
}

seedAdmin().catch(async error => {
  console.error('Seeding failed:', error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
