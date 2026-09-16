import { z } from 'zod';
import { imageSchema, statusEnum, paginationQuery, searchQuery } from './common.js';

const COUNTRIES = ['Kenya', 'Tanzania', 'Uganda', 'Rwanda', 'Zanzibar'];

const parkSchema = z.object({
  name: z.string().trim().min(1, 'Each park needs a name.'),
  slug: z.string().trim().optional(),
  blurb: z.string().trim().max(240).optional(),
  image: imageSchema.optional(),
  bestTime: z.string().trim().optional(),
  highlights: z.array(z.string()).default([]),
});

export const createDestinationSchema = z.object({
  name: z.string().trim().min(2, 'Give the destination a name.').max(120),
  slug: z.string().trim().optional(),
  country: z.enum(COUNTRIES),
  tagline: z.string().trim().max(180).optional(),
  categoryLabel: z.string().trim().max(60).default('Destination'),
  overview: z.string().trim().min(20, 'Write an overview.'),

  heroImage: imageSchema,
  cardImage: imageSchema,

  highlights: z.array(z.string()).default([]),
  bestTime: z
    .object({
      months: z.array(z.string()).default([]),
      note: z.string().optional(),
    })
    .optional(),

  parks: z.array(parkSchema).default([]),

  featured: z.boolean().default(false),
  status: statusEnum.default('draft'),
  order: z.coerce.number().int().default(0),

  seo: z
    .object({
      metaTitle: z.string().max(70).optional(),
      metaDescription: z.string().max(180).optional(),
      ogImage: z.string().optional(),
    })
    .optional(),
});

export const updateDestinationSchema = createDestinationSchema.partial();

export const destinationListQuery = paginationQuery.extend({
  country: z.enum(COUNTRIES).optional(),
  featured: z.enum(['true', 'false']).optional(),
  status: statusEnum.optional(),
  q: searchQuery,
  sort: z.enum(['order-asc', 'newest', 'name-asc', 'name-desc']).optional(),
});
