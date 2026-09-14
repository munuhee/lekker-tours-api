import { SiteSettings } from '../models/SiteSettings.js';
import { sendData } from '../utils/respond.js';
import { revalidate } from '../utils/revalidate.js';

export async function getSettings(req, res) {
  const settings = await SiteSettings.getSingleton();
  sendData(res, settings.toJSON());
}

export async function updateSettings(req, res) {
  const settings = await SiteSettings.getSingleton();

  // Merge per top-level section so a partial save never wipes sibling fields.
  for (const [section, value] of Object.entries(req.body)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      settings[section] = { ...(settings[section]?.toObject?.() ?? settings[section]), ...value };
    } else {
      settings[section] = value;
    }
  }

  await settings.save();
  await revalidate(['settings', 'home']);
  sendData(res, settings.toJSON());
}
