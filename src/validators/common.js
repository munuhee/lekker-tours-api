import { z } from 'zod';

/**
 * Primary keys are Postgres UUIDs. The name is kept so the many `objectId`
 * imports across the validators still resolve; only the shape changed.
 */
export const objectId = z.string().uuid('That is not a valid id.');

export const idParam = z.object({ id: objectId });
export const slugParam = z.object({ slug: z.string().min(1).max(120) });

export const statusEnum = z.enum(['draft', 'published']);

export const imageSchema = z.object({
  url: z.string().min(1, 'An image URL is required.'),
  alt: z.string().min(1, 'Alt text is required for accessibility.'),
  caption: z.string().optional(),
});

/** Query coercion for list endpoints: ?page=2&limit=12 arrive as strings. */
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

export const booleanish = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((v) => v === true || v === 'true');

/** Trims strings and drops empty ones, so blank form fields don't overwrite data. */
export const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === '' ? undefined : v));
