/**
 * URL-safe slug from arbitrary title text.
 * Strips diacritics so "Ngorongoro Crater, Day Trip" -> "ngorongoro-crater-day-trip".
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
 * Ensures uniqueness against a Prisma delegate, appending -2, -3, … as needed.
 * `excludeId` lets an update keep its own slug.
 *
 *   await uniqueSlug(prisma.tour, 'Big Five Express')
 *
 * This is still a check-then-write race: two concurrent creates can settle on
 * the same candidate. The `slug` columns carry UNIQUE constraints, so the loser
 * gets a P2002 that the error middleware turns into a 409 rather than a
 * duplicate row, same guarantee the Mongo unique index gave.
 */
export async function uniqueSlug(delegate, source, excludeId = null) {
  const base = slugify(source) || 'item';
  let candidate = base;
  let suffix = 1;

  for (;;) {
    const where = { slug: candidate };
    if (excludeId) where.NOT = { id: excludeId };

    const clash = await delegate.findFirst({ where, select: { id: true } });
    if (!clash) return candidate;

    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}
