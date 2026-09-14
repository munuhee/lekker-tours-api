/**
 * Idempotent content seed. Safe to run repeatedly: every document is upserted
 * by its natural key (slug, or question/authorName where there is no slug), so
 * a second run updates in place rather than creating duplicates.
 *
 * Run with:  npm run seed        (from the repo root)
 */
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { Tour } from '../models/Tour.js';
import { Destination } from '../models/Destination.js';
import { BlogPost } from '../models/BlogPost.js';
import { Testimonial } from '../models/Testimonial.js';
import { FAQ } from '../models/FAQ.js';
import { SiteSettings } from '../models/SiteSettings.js';

import { destinations, withParkSlugs } from './data/destinations.js';
import { tours } from './data/tours.js';
import { faqs, testimonials, blogPosts, siteValues } from './data/content.js';

async function seedDestinations() {
  const bySlug = new Map();

  for (const raw of destinations) {
    // findOneAndUpdate with upsert bypasses pre('validate') slug generation,
    // so both the destination slug and every park slug are set explicitly.
    const data = { ...raw, parks: withParkSlugs(raw.parks ?? []) };
    const doc = await Destination.findOneAndUpdate(
      { slug: data.slug },
      { $set: data },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
    );
    bySlug.set(data.slug, doc._id);
  }

  console.log(`[seed] destinations: ${destinations.length}`);
  return bySlug;
}

async function seedTours(destinationIds) {
  let sourced = 0;
  let authored = 0;

  for (const raw of tours) {
    const { destinationSlug, sourcedFromLekker, ...data } = raw;
    data.destination = destinationIds.get(destinationSlug);

    if (!data.destination) {
      throw new Error(`Tour "${data.title}" references unknown destination "${destinationSlug}".`);
    }

    // Discriminators need the concrete model, not the base, to apply their schema.
    const Model = Tour.discriminators?.[data.category] ?? Tour;
    await Model.findOneAndUpdate(
      { slug: data.slug },
      { $set: data },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
    );

    if (sourcedFromLekker) sourced += 1;
    else authored += 1;
  }

  console.log(`[seed] tours: ${tours.length} (${sourced} from lekkertours.com, ${authored} authored)`);
}

async function seedSimple(Model, items, keyOf, label) {
  for (const item of items) {
    await Model.findOneAndUpdate(
      keyOf(item),
      { $set: item },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
    );
  }
  console.log(`[seed] ${label}: ${items.length}`);
}

async function seedSettings() {
  const settings = await SiteSettings.getSingleton();
  // Only fill the values strip if an administrator has not customised it.
  if (!settings.values?.length) {
    settings.values = siteValues;
    await settings.save();
  }
  console.log('[seed] site settings ready');
}

async function run() {
  await connectDatabase();

  const destinationIds = await seedDestinations();
  await seedTours(destinationIds);
  await seedSimple(BlogPost, blogPosts, (p) => ({ slug: p.slug }), 'blog posts');
  await seedSimple(Testimonial, testimonials, (t) => ({ authorName: t.authorName }), 'testimonials');
  await seedSimple(FAQ, faqs, (f) => ({ question: f.question }), 'FAQs');
  await seedSettings();

  const counts = {
    tours: await Tour.countDocuments(),
    destinations: await Destination.countDocuments(),
    blog: await BlogPost.countDocuments(),
    testimonials: await Testimonial.countDocuments(),
    faqs: await FAQ.countDocuments(),
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
