/**
 * URL-safe slug from arbitrary title text.
 * Strips diacritics so "Ngorongoro Crater — Day Trip" -> "ngorongoro-crater-day-trip".
 */
export function slugify(input) {
  return String(input)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // combining marks left behind by NFKD
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '') // drop apostrophes rather than turning them into hyphens
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

/**
 * Ensures uniqueness against a Mongoose model, appending -2, -3, … as needed.
 * `excludeId` lets an update keep its own slug.
 */
export async function uniqueSlug(Model, source, excludeId = null) {
  const base = slugify(source) || 'item';
  let candidate = base;
  let suffix = 1;

  for (;;) {
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    const clash = await Model.exists(query);
    if (!clash) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}
