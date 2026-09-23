import { prisma, connectDatabase, disconnectDatabase } from '../config/db.js';
import { SYSTEM_ROLES } from '../config/permissions.js';

/**
 * Creates the starter roles and backfills any account that predates them.
 *
 * Safe to re-run. Existing roles are matched by name and have their permissions
 * refreshed, except a locked role, whose stored array is irrelevant because
 * permissionsFor() grants it everything.
 */
async function run() {
  await connectDatabase();

  for (const definition of SYSTEM_ROLES) {
    const existing = await prisma.role.findUnique({ where: { name: definition.name } });

    if (!existing) {
      await prisma.role.create({ data: definition });
      console.log(`[seed:roles] created role ${definition.name}`);
      continue;
    }

    // A role an admin has since customised should not be silently reset, so
    // only the locked Administrator role is kept in step with the code.
    if (existing.locked) {
      await prisma.role.update({
        where: { id: existing.id },
        data: { permissions: definition.permissions, description: definition.description },
      });
      console.log(`[seed:roles] refreshed ${definition.name}`);
    } else {
      console.log(`[seed:roles] ${definition.name} already exists, leaving it untouched.`);
    }
  }

  // Accounts created before this migration hold roleId = null, which resolves
  // to no permissions at all. Anyone who was an 'admin' under the old enum
  // becomes an Administrator; everyone else an Editor.
  const administrator = await prisma.role.findUnique({ where: { name: 'Administrator' } });
  const editor = await prisma.role.findUnique({ where: { name: 'Editor' } });

  const orphans = await prisma.adminUser.findMany({ where: { roleId: null } });

  for (const user of orphans) {
    const roleId = user.role === 'admin' ? administrator.id : editor.id;
    await prisma.adminUser.update({ where: { id: user.id }, data: { roleId } });
    console.log(
      `[seed:roles] assigned ${user.email} -> ${user.role === 'admin' ? 'Administrator' : 'Editor'}`
    );
  }

  if (orphans.length === 0) {
    console.log('[seed:roles] no accounts needed backfilling.');
  }

  await disconnectDatabase();
}

run().catch(async (err) => {
  console.error('[seed:roles] failed:', err);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
