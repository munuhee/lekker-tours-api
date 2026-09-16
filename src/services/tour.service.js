import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/slugify.js';
import { serializeTour, serializeMany } from '../utils/serialize.js';

const SORTS = {
  recommended: [{ featured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
  'price-asc': [{ priceFrom: 'asc' }],
  'price-desc': [{ priceFrom: 'desc' }],
  'duration-asc': [{ durationDays: 'asc' }],
  newest: [{ createdAt: 'desc' }],
};

/** The destination fields the tour pages actually render. */
const DESTINATION_CARD = { select: { id: true, name: true, slug: true, country: true } };
const DESTINATION_DETAIL = {
  select: { id: true, name: true, slug: true, country: true, heroImage: true },
};

function buildWhere(query, { publishedOnly }) {
  const where = {};
  if (publishedOnly) where.status = 'published';
  else if (query.status) where.status = query.status;

  if (query.category) where.category = query.category;
  // `countries` is a Postgres array column; `has` is the array-contains test.
  if (query.country) where.countries = { has: query.country };
  if (query.destination) where.destinationId = query.destination;
  if (query.featured) where.featured = query.featured === 'true';
  if (query.bestSelling) where.bestSelling = query.bestSelling === 'true';

  if (query.minPrice != null || query.maxPrice != null) {
    where.priceFrom = {};
    if (query.minPrice != null) where.priceFrom.gte = query.minPrice;
    if (query.maxPrice != null) where.priceFrom.lte = query.maxPrice;
  }

  // Substring rather than full-text search, so partial words match as the user
  // types — the same reason the Mongo version used a regex over $text.
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: 'insensitive' } },
      { summary: { contains: query.q, mode: 'insensitive' } },
      { highlights: { has: query.q } },
    ];
  }

  return where;
}

export async function listTours(query, { publishedOnly = true } = {}) {
  const { page, limit, sort } = query;
  const where = buildWhere(query, { publishedOnly });

  const [items, total] = await Promise.all([
    prisma.tour.findMany({
      where,
      orderBy: SORTS[sort] ?? SORTS.recommended,
      skip: (page - 1) * limit,
      take: limit,
      include: { destination: DESTINATION_CARD },
    }),
    prisma.tour.count({ where }),
  ]);

  return { items: serializeMany(items, serializeTour), total, page, limit };
}

export async function getTourBySlug(slug, { publishedOnly = true } = {}) {
  const where = { slug };
  if (publishedOnly) where.status = 'published';

  const tour = await prisma.tour.findFirst({
    where,
    include: { destination: DESTINATION_DETAIL },
  });

  if (!tour) throw ApiError.notFound('We could not find that tour.');
  return serializeTour(tour);
}

export async function getTourById(id) {
  const tour = await prisma.tour.findUnique({
    where: { id },
    include: { destination: DESTINATION_CARD },
  });
  if (!tour) throw ApiError.notFound('We could not find that tour.');
  return serializeTour(tour);
}

export async function getRelatedTours(slug, limit = 3) {
  const current = await prisma.tour.findFirst({ where: { slug, status: 'published' } });
  if (!current) throw ApiError.notFound('We could not find that tour.');

  // Prefer the same category, then fall back to shared countries.
  const related = await prisma.tour.findMany({
    where: {
      id: { not: current.id },
      status: 'published',
      OR: [
        { category: current.category },
        { countries: { hasSome: current.countries ?? [] } },
      ],
    },
    orderBy: [{ featured: 'desc' }, { order: 'asc' }],
    take: limit,
    include: { destination: DESTINATION_CARD },
  });

  return serializeMany(related, serializeTour);
}

/**
 * The API accepts `destination` as an id string (the web app's forms send it
 * that way), but Prisma writes the FK as `destinationId`.
 */
function toRow(payload) {
  const { destination, ...data } = payload;
  if (destination !== undefined) data.destinationId = destination || null;
  return data;
}

export async function createTour(payload) {
  const slug = await uniqueSlug(prisma.tour, payload.slug || payload.title);
  const data = toRow({ ...payload, slug });

  // durationNights defaulted off durationDays in the old pre('validate') hook.
  if (data.durationNights == null && data.durationDays != null) {
    data.durationNights = Math.max(0, data.durationDays - 1);
  }

  const tour = await prisma.tour.create({
    data,
    include: { destination: { select: { id: true, name: true, slug: true, country: true } } },
  });
  return serializeTour(tour);
}

export async function updateTour(id, payload) {
  const existing = await prisma.tour.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('We could not find that tour.');

  const data = { ...payload };
  if (data.slug && data.slug !== existing.slug) {
    data.slug = await uniqueSlug(prisma.tour, data.slug, existing.id);
  } else {
    // Keep the existing slug on rename so published links do not break.
    delete data.slug;
  }

  const tour = await prisma.tour.update({
    where: { id: existing.id },
    data: toRow(data),
    include: { destination: { select: { id: true, name: true, slug: true, country: true } } },
  });
  return serializeTour(tour);
}

export async function setTourStatus(id, status) {
  const tour = await prisma.tour.update({ where: { id }, data: { status } });
  return serializeTour(tour);
}

export async function deleteTour(id) {
  await prisma.tour.delete({ where: { id } });
  return { id };
}

/**
 * Bulk publish/unpublish and delete. The rows are read first so the caller can
 * revalidate each affected slug — updateMany/deleteMany return only a count.
 */
export async function bulkSetTourStatus(ids, status) {
  const existing = await prisma.tour.findMany({
    where: { id: { in: ids } },
    select: { id: true, slug: true },
  });
  if (existing.length === 0) throw ApiError.notFound('None of those tours still exist.');

  await prisma.tour.updateMany({ where: { id: { in: ids } }, data: { status } });
  return { ids: existing.map((t) => t.id), slugs: existing.map((t) => t.slug), status };
}

export async function bulkDeleteTours(ids) {
  const existing = await prisma.tour.findMany({
    where: { id: { in: ids } },
    select: { id: true, slug: true },
  });
  if (existing.length === 0) throw ApiError.notFound('None of those tours still exist.');

  await prisma.tour.deleteMany({ where: { id: { in: ids } } });
  return { ids: existing.map((t) => t.id), slugs: existing.map((t) => t.slug) };
}
