import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { AdminUser } from '../models/AdminUser.js';
import { env } from '../config/env.js';

async function run() {
  if (!env.admin.password) {
    console.error('[seed:admin] ADMIN_PASSWORD is not set in api/.env — nothing to do.');
    process.exit(1);
  }

  await connectDatabase();

  const existing = await AdminUser.findOne({ email: env.admin.email });
  if (existing) {
    console.log(`[seed:admin] ${env.admin.email} already exists — leaving it untouched.`);
    console.log('[seed:admin] To reset the password, delete the adminusers document and re-run.');
  } else {
    // The pre-save hook hashes this; never store the plaintext.
    await AdminUser.create({
      email: env.admin.email,
      passwordHash: env.admin.password,
      name: env.admin.name,
      role: 'admin',
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
