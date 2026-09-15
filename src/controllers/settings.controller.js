import { prisma } from '../config/db.js';
import { sendData } from '../utils/respond.js';
import { revalidate } from '../utils/revalidate.js';
import { serialize } from '../utils/serialize.js';
import { SITE_SETTINGS_DEFAULTS } from '../config/siteSettingsDefaults.js';

/**
 * Always returns the one settings row, creating it with defaults if absent.
 * Was SiteSettings.getSingleton() on the Mongoose model.
 *
 * upsert on the unique `key` column makes this safe if two requests race: the
 * loser's insert conflicts and falls through to the (empty) update.
 */
export async function getSingletonSettings() {
  return prisma.siteSettings.upsert({
    where: { key: 'primary' },
    update: {},
    create: { key: 'primary', ...SITE_SETTINGS_DEFAULTS },
  });
}

export async function getSettings(req, res) {
  sendData(res, serialize(await getSingletonSettings()));
}

export async function updateSettings(req, res) {
  const current = await getSingletonSettings();

  // Merge per top-level section so a partial save never wipes sibling fields.
  // These are JSON columns: Prisma replaces the whole value, so the merge that
  // Mongoose did field-by-field has to happen here before the write.
  const data = {};
  for (const [section, value] of Object.entries(req.body)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      data[section] = { ...(current[section] ?? {}), ...value };
    } else {
      data[section] = value;
    }
  }

  const settings = await prisma.siteSettings.update({ where: { id: current.id }, data });
  await revalidate(['settings', 'home']);
  sendData(res, serialize(settings));
}
