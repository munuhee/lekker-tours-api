import { Tour } from '../models/Tour.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/slugify.js';

const SORTS = {
  recommended: { featured: -1, order: 1, createdAt: -1 },
  'price-asc': { priceFrom: 1 },
  'price-desc': { priceFrom: -1 },
  'duration-asc': { durationDays: 1 },
  newest: { createdAt: -1 },
};

function buildFilter(query, { publishedOnly }) {
  const filter = {};
  if (publishedOnly) filter.status = 'published';
  else if (query.status) filter.status = query.status;

  if (query.category) filter.category = query.category;
  if (query.country) filter.countries = query.country;
  if (query.destination) filter.destination = query.destination;
  if (query.featured) filter.featured = query.featured === 'true';
  if (query.bestSelling) filter.bestSelling = query.bestSelling === 'true';

  if (query.minPrice != null || query.maxPrice != null) {
    filter.priceFrom = {};
    if (query.minPrice != null) filter.priceFrom.$gte = query.minPrice;
    if (query.maxPrice != null) filter.priceFrom.$lte = query.maxPrice;
  }

  // Regex rather than $text so partial words match as the user types.
  if (query.q) {
    const rx = new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: rx }, { summary: rx }, { highlights: rx }];
  }

  return filter;
}

export async function listTours(query, { publishedOnly = true } = {}) {
  const { page, limit, sort } = query;
  const filter = buildFilter(query, { publishedOnly });

  const [items, total] = await Promise.all([
    Tour.find(filter)
      .sort(SORTS[sort] ?? SORTS.recommended)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('destination', 'name slug country')
      .lean({ virtuals: true }),
    Tour.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function getTourBySlug(slug, { publishedOnly = true } = {}) {
  const filter = { slug };
  if (publishedOnly) filter.status = 'published';

  const tour = await Tour.findOne(filter)
    .populate('destination', 'name slug country heroImage')
    .lean({ virtuals: true });

  if (!tour) throw ApiError.notFound('We could not find that tour.');
  return tour;
}

export async function getTourById(id) {
  const tour = await Tour.findById(id).lean({ virtuals: true });
  if (!tour) throw ApiError.notFound('We could not find that tour.');
  return tour;
}

export async function getRelatedTours(slug, limit = 3) {
  const current = await Tour.findOne({ slug, status: 'published' }).lean();
  if (!current) throw ApiError.notFound('We could not find that tour.');

  // Prefer the same category, then fall back to shared countries.
  const related = await Tour.find({
    _id: { $ne: current._id },
    status: 'published',
    $or: [{ category: current.category }, { countries: { $in: current.countries ?? [] } }],
  })
    .sort({ featured: -1, order: 1 })
    .limit(limit)
    .lean({ virtuals: true });

  return related;
}

export async function createTour(payload) {
  const slug = await uniqueSlug(Tour, payload.slug || payload.title);
  const tour = await Tour.create({ ...payload, slug });
  return tour.toJSON();
}

export async function updateTour(id, payload) {
  const tour = await Tour.findById(id);
  if (!tour) throw ApiError.notFound('We could not find that tour.');

  if (payload.slug && payload.slug !== tour.slug) {
    payload.slug = await uniqueSlug(Tour, payload.slug, tour._id);
  } else if (payload.title && !payload.slug) {
    // Keep the existing slug on rename so published links do not break.
    delete payload.slug;
  }

  Object.assign(tour, payload);
  await tour.save();
  return tour.toJSON();
}

export async function setTourStatus(id, status) {
  const tour = await Tour.findByIdAndUpdate(id, { status }, { returnDocument: 'after', runValidators: true });
  if (!tour) throw ApiError.notFound('We could not find that tour.');
  return tour.toJSON();
}

export async function deleteTour(id) {
  const tour = await Tour.findByIdAndDelete(id);
  if (!tour) throw ApiError.notFound('We could not find that tour.');
  return { id };
}
