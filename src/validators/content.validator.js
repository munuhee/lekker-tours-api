import { z } from 'zod';
import { imageSchema, statusEnum, paginationQuery, objectId, searchQuery } from './common.js';

/* ---------- blog ---------- */

export const createBlogPostSchema = z.object({
  title: z.string().trim().min(3).max(160),
  slug: z.string().trim().optional(),
  excerpt: z.string().trim().min(10, 'Write a short excerpt.').max(300),
  content: z.string().trim().min(20, 'Write the post body.'),
  coverImage: imageSchema,
  author: z
    .object({ name: z.string().trim().default('Lekker Tours'), avatar: z.string().optional() })
    .optional(),
  tags: z.array(z.string()).default([]),
  readingMinutes: z.coerce.number().int().min(1).optional(),
  publishedAt: z.coerce.date().optional(),
  featured: z.boolean().default(false),
  status: statusEnum.default('draft'),
  seo: z
    .object({
      metaTitle: z.string().max(70).optional(),
      metaDescription: z.string().max(180).optional(),
      ogImage: z.string().optional(),
    })
    .optional(),
});

export const updateBlogPostSchema = createBlogPostSchema.partial();

export const blogListQuery = paginationQuery.extend({
  tag: z.string().trim().optional(),
  featured: z.enum(['true', 'false']).optional(),
  status: statusEnum.optional(),
  q: searchQuery,
  sort: z.enum(['newest', 'oldest', 'title-asc', 'title-desc']).optional(),
});

/* ---------- testimonials ---------- */

export const createTestimonialSchema = z.object({
  authorName: z.string().trim().min(2, 'Enter the reviewer name.').max(120),
  authorLocation: z.string().trim().max(120).optional(),
  avatar: z.object({ url: z.string().optional(), alt: z.string().optional() }).optional(),
  quote: z.string().trim().min(10, 'Enter the testimonial.').max(600),
  rating: z.coerce.number().min(1).max(5).default(5),
  tour: objectId.optional(),
  tourName: z.string().trim().optional(),
  travelledOn: z.coerce.date().optional(),
  featured: z.boolean().default(false),
  status: statusEnum.default('draft'),
  order: z.coerce.number().int().default(0),
});

export const updateTestimonialSchema = createTestimonialSchema.partial();

export const testimonialListQuery = paginationQuery.extend({
  featured: z.enum(['true', 'false']).optional(),
  status: statusEnum.optional(),
  q: searchQuery,
  sort: z.enum(['newest', 'oldest', 'author-asc', 'rating-desc']).optional(),
});

/* ---------- FAQs ---------- */

export const createFaqSchema = z.object({
  question: z.string().trim().min(5, 'Enter the question.').max(240),
  answer: z.string().trim().min(5, 'Enter the answer.'),
  group: z.enum(['general', 'booking', 'travel', 'payment']).default('general'),
  order: z.coerce.number().int().default(0),
  status: statusEnum.default('draft'),
});

export const updateFaqSchema = createFaqSchema.partial();

export const faqListQuery = paginationQuery.extend({
  group: z.enum(['general', 'booking', 'travel', 'payment']).optional(),
  status: statusEnum.optional(),
  q: searchQuery,
  sort: z.enum(['order-asc', 'newest', 'question-asc']).optional(),
});
