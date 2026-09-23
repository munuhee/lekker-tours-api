import bcrypt from 'bcryptjs';
import { prisma, connectDatabase, disconnectDatabase } from '../config/db.js';
import { env } from '../config/env.js';

async function run() {
  if (!env.admin.password) {
    console.error('[seed:admin] ADMIN_PASSWORD is not set in api/.env, nothing to do.');
    process.exit(1);
  }

  await connectDatabase();

  const existing = await prisma.adminUser.findUnique({ where: { email: env.admin.email } });
  if (existing) {
    console.log(`[seed:admin] ${env.admin.email} already exists, leaving it untouched.`);
    console.log('[seed:admin] To reset the password, delete the admin_users row and re-run.');
  } else {
    // The Mongoose pre('save') hook used to hash this. Postgres has no hooks,
    // so hashing happens here, the plaintext is never stored.
    await prisma.adminUser.create({
      data: {
        email: env.admin.email,
        passwordHash: await bcrypt.hash(env.admin.password, 12),
        name: env.admin.name,
        role: 'admin',
      },
    });
    console.log(`[seed:admin] created administrator ${env.admin.email}`);
  }

  await disconnectDatabase();
}

run().catch(async (err) => {
  console.error('[seed:admin] failed:', err);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
