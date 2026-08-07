import mongoose from 'mongoose';
import { z } from 'zod';

import { User } from '@/models/user.model';

import { USER_ROLES } from '@/constants/roles.const';

import { connectToDatabase } from '@/lib/mongodb';

/*
  Creates the super administrator — the one account no screen can make, and the one no
  screen can change. It replaces the old `seed-admin` script: administrators are now
  created through the UI by the super administrator, which leaves exactly one way for an
  account to come into existence outside the application's own rules, rather than two.

  Run it with the credentials in the environment rather than on the command line, so the
  password does not end up in shell history:

    SEED_SUPER_ADMIN_NAME="Department Head" \
    SEED_SUPER_ADMIN_EMAIL="head@department.edu" \
    SEED_SUPER_ADMIN_PASSWORD="..." \
    npm run seed:super-admin

  These three are read straight from `process.env` and validated here rather than
  declared in `env/server.ts`. They are inputs to a one-off script, not application
  configuration, and requiring them at build time would be wrong.
*/
const SeedSuperAdminSchema = z.object({
  SEED_SUPER_ADMIN_NAME: z.string().trim().min(1, 'SEED_SUPER_ADMIN_NAME is required'),
  SEED_SUPER_ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email('SEED_SUPER_ADMIN_EMAIL must be a valid email address')),
  SEED_SUPER_ADMIN_PASSWORD: z.string().min(8, 'SEED_SUPER_ADMIN_PASSWORD must be at least 8 characters'),
});

async function seedSuperAdmin(): Promise<void> {
  const parsed = SeedSuperAdminSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Cannot seed the super administrator:');
    // Zod's own "required" message wins over a custom one, so the path is what
    // actually tells you which variable is missing.
    parsed.error.issues.forEach(issue => console.error(`  - ${issue.path.join('.') || 'input'}: ${issue.message}`));
    console.error('\nSet SEED_SUPER_ADMIN_NAME, SEED_SUPER_ADMIN_EMAIL and SEED_SUPER_ADMIN_PASSWORD, then run again.');
    process.exitCode = 1;
    return;
  }

  const { SEED_SUPER_ADMIN_NAME, SEED_SUPER_ADMIN_EMAIL, SEED_SUPER_ADMIN_PASSWORD } = parsed.data;

  await connectToDatabase();
  console.log(`Connected to "${mongoose.connection.name}".`);

  /*
    Checked here for a readable message, and enforced by a partial unique index on the
    model regardless — two people running this at once would otherwise both pass the
    check. The index is what makes "exactly one" true; this is what makes it polite.
  */
  const existingSuperAdmin = await User.findOne({ role: USER_ROLES.SUPER_ADMIN }).lean();

  if (existingSuperAdmin) {
    console.log(`A super administrator already exists (${existingSuperAdmin.email}) — nothing to do.`);
    console.log('There is only ever one, and it cannot be replaced from here.');
    await mongoose.disconnect();
    return;
  }

  const existingEmail = await User.findOne({ email: SEED_SUPER_ADMIN_EMAIL }).lean();

  if (existingEmail) {
    // Idempotent on purpose: re-running must never silently reset a password.
    console.log(`An account already exists for ${SEED_SUPER_ADMIN_EMAIL} — nothing to do.`);
    console.log('Use an address that is not already registered, or promote nobody: the role is seeded, not granted.');
    await mongoose.disconnect();
    return;
  }

  const superAdmin = await User.create({
    name: SEED_SUPER_ADMIN_NAME,
    email: SEED_SUPER_ADMIN_EMAIL,
    // Hashed by the model's pre-save hook, never here.
    password: SEED_SUPER_ADMIN_PASSWORD,
    role: USER_ROLES.SUPER_ADMIN,
    isApproved: true,
    isActive: true,
  });

  const adminCount = await User.countDocuments({ role: USER_ROLES.ADMIN, isActive: true });

  console.log(`Created super administrator ${superAdmin.email} (${String(superAdmin._id)}).`);
  console.log(`The department has ${adminCount} active administrator(s) alongside it — the ceiling is three.`);
  console.log('Sign in with this account to create the first administrator.');

  await mongoose.disconnect();
}

seedSuperAdmin().catch(async error => {
  console.error('Seeding failed:', error instanceof Error ? error.message : error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
