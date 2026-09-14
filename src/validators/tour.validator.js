import { z } from 'zod';
import { imageSchema, statusEnum, paginationQuery, objectId } from './common.js';

const COUNTRIES = ['Kenya', 'Tanzania', 'Uganda', 'Rwanda', 'Zanzibar'];
const CATEGORIES = ['SafariExpedition', 'WeekendEscape'];

const itineraryDay = z.object({
  day: z.coerce.number().int().min(1),
  title: z.string().min(1, 'Each day needs a title.'),
  description: z.string().optional(),
  activities: z.array(z.string()).default([]),
  meals: z.array(z.enum(['Breakfast', 'Lunch', 'Dinner'])).default([]),
  accommodation: z.string().optional(),
});

export const createTourSchema = z.object({
  title: z.string().trim().min(3, 'Give the tour a title.').max(140),
  slug: z.string().trim().optional(),
  category: z.enum(CATEGORIES),
  summary: z.string().trim().min(10, 'Write a short summary.').max(300),
  description: z.string().trim().min(20, 'Write a fuller description.'),

  priceFrom: z.coerce.number().min(0, 'Price cannot be negative.'),
  currency: z.string().length(3).default('USD'),
  durationDays: z.coerce.number().int().min(1).max(60),
  durationNights: z.coerce.number().int().min(0).max(60).optional(),
  groupSizeMax: z.coerce.number().int().min(1).default(12),
  difficulty: z.enum(['easy', 'moderate', 'challenging']).default('moderate'),

  rating: z.coerce.number().min(0).max(5).optional(),
  reviewCount: z.coerce.number().int().min(0).optional(),

  destination: objectId.optional(),
  countries: z.array(z.enum(COUNTRIES)).default([]),

  highlights: z.array(z.string()).default([]),
  itinerary: z.array(itineraryDay).default([]),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),

  heroImage: imageSchema,
  gallery: z.array(imageSchema).default([]),

  featured: z.boolean().default(false),
  bestSelling: z.boolean().default(false),
  status: statusEnum.default('draft'),
  order: z.coerce.number().int().default(0),

  seo: z
    .object({
      metaTitle: z.string().max(70).optional(),
      metaDescription: z.string().max(180).optional(),
      ogImage: z.string().optional(),
    })
    .optional(),

  // Discriminator-specific fields.
  parks: z.array(z.string()).optional(),
  gameDriveCount: z.coerce.number().int().min(0).optional(),
  conservancyFeesIncluded: z.boolean().optional(),
  departsFrom: z.string().optional(),
  weekendDates: z.array(z.coerce.date()).optional(),
});

/** Every field optional on update; category cannot change (Mongoose discriminator is immutable). */
export const updateTourSchema = createTourSchema.partial().omit({ category: true });

export const tourListQuery = paginationQuery.extend({
  category: z.enum(CATEGORIES).optional(),
  country: z.enum(COUNTRIES).optional(),
  destination: z.string().optional(),
  featured: z.enum(['true', 'false']).optional(),
  bestSelling: z.enum(['true', 'false']).optional(),
  q: z.string().trim().max(120).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(['recommended', 'price-asc', 'price-desc', 'duration-asc', 'newest']).default('recommended'),
});

export const adminTourListQuery = tourListQuery.extend({
  status: statusEnum.optional(),
});

export const statusBodySchema = z.object({ status: statusEnum });
