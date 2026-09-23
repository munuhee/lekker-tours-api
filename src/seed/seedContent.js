/**
 * Idempotent content seed. Safe to run repeatedly: every row is upserted by its
 * natural key (slug, or question/authorName where there is no slug), so a
 * second run updates in place rather than creating duplicates.
 *
 * Run with:  npm run seed        (from the repo root)
 */
import { prisma, connectDatabase, disconnectDatabase } from '../config/db.js';
import { SITE_SETTINGS_DEFAULTS } from '../config/siteSettingsDefaults.js';

import { destinations, withParkSlugs } from './data/destinations.js';
import { tours } from './data/tours.js';
import { faqs, testimonials, blogPosts, siteValues } from './data/content.js';

async function seedDestinations() {
  const bySlug = new Map();

  for (const raw of destinations) {
    const data = { ...raw, parks: withParkSlugs(raw.parks ?? []) };
    const row = await prisma.destination.upsert({
      where: { slug: data.slug },
      update: data,
      create: data,
    });
    bySlug.set(data.slug, row.id);
  }

  console.log(`[seed] destinations: ${destinations.length}`);
  return bySlug;
}

async function seedTours(destinationIds) {
  let sourced = 0;
  let authored = 0;

  for (const raw of tours) {
    const { destinationSlug, sourcedFromLekker, ...data } = raw;

    const destinationId = destinationIds.get(destinationSlug);
    if (!destinationId) {
      throw new Error(`Tour "${data.title}" references unknown destination "${destinationSlug}".`);
    }
    data.destinationId = destinationId;

    // Defaults the Mongoose pre('validate') hook used to supply.
    if (data.durationNights == null) {
      data.durationNights = Math.max(0, data.durationDays - 1);
    }

    // Subtype columns are nullable and only meaningful for their own category,
    // so a WeekendEscape must not carry SafariExpedition's array defaults.
    data.parks = data.parks ?? [];
    data.weekendDates = data.weekendDates ?? [];

    await prisma.tour.upsert({
      where: { slug: data.slug },
      update: data,
      create: data,
    });

    if (sourcedFromLekker) sourced += 1;
    else authored += 1;
  }

  console.log(`[seed] tours: ${tours.length} (${sourced} from lekkertours.com, ${authored} authored)`);
}

async function seedBlogPosts() {
  for (const post of blogPosts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: post,
      create: post,
    });
  }
  console.log(`[seed] blog posts: ${blogPosts.length}`);
}

/**
 * Testimonials have no unique column to upsert on, authorName is not unique in
 * the schema, since two guests could share a name. Match on it explicitly and
 * fall back to a create.
 */
async function seedTestimonials() {
  for (const item of testimonials) {
    const existing = await prisma.testimonial.findFirst({
      where: { authorName: item.authorName },
      select: { id: true },
    });

    if (existing) {
      await prisma.testimonial.update({ where: { id: existing.id }, data: item });
    } else {
      await prisma.testimonial.create({ data: item });
    }
  }
  console.log(`[seed] testimonials: ${testimonials.length}`);
}

async function seedFaqs() {
  for (const faq of faqs) {
    await prisma.faq.upsert({
      where: { question: faq.question },
      update: faq,
      create: faq,
    });
  }
  console.log(`[seed] FAQs: ${faqs.length}`);
}

async function seedSettings() {
  const settings = await prisma.siteSettings.upsert({
    where: { key: 'primary' },
    update: {},
    create: { key: 'primary', ...SITE_SETTINGS_DEFAULTS },
  });

  // Only fill the values strip if an administrator has not customised it.
  if (!Array.isArray(settings.values) || settings.values.length === 0) {
    await prisma.siteSettings.update({
      where: { id: settings.id },
      data: { values: siteValues },
    });
  }
  console.log('[seed] site settings ready');
}

async function run() {
  await connectDatabase();

  const destinationIds = await seedDestinations();
  await seedTours(destinationIds);
  await seedBlogPosts();
  await seedTestimonials();
  await seedFaqs();
  await seedSettings();

  const counts = {
    tours: await prisma.tour.count(),
    destinations: await prisma.destination.count(),
    blog: await prisma.blogPost.count(),
    testimonials: await prisma.testimonial.count(),
    faqs: await prisma.faq.count(),
  };
  console.log('[seed] totals in database:', counts);

  await disconnectDatabase();
  console.log('[seed] done');
}

run().catch(async (err) => {
  console.error('[seed] failed:', err);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
