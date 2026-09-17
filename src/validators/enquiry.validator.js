import { z } from 'zod';
import { paginationQuery, objectId, searchQuery } from './common.js';

const EXPEDITION_INTERESTS = ['Big Five Safaris', 'Weekend Escape', 'East Africa Tours'];

const baseFields = {
  name: z.string().trim().min(2, 'Please tell us your name.').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  phone: z.string().trim().max(40).optional(),
};

/** Contact form — mirrors the fields on lekkertours.com/contact. */
const contactEnquiry = z.object({
  type: z.literal('contact'),
  ...baseFields,
  expeditionInterest: z.enum(EXPEDITION_INTERESTS).optional(),
  budgetUSD: z.coerce.number().min(0).optional(),
  message: z.string().trim().min(10, 'Tell us a little about your trip.').max(4000),
});

/** Booking form on a tour detail page. */
const bookingEnquiry = z.object({
  type: z.literal('booking'),
  ...baseFields,
  tour: objectId.optional(),
  tourTitle: z.string().trim().optional(),
  travelDate: z.coerce.date().optional(),
  guests: z
    .object({
      adults: z.coerce.number().int().min(1).default(1),
      children: z.coerce.number().int().min(0).default(0),
      infants: z.coerce.number().int().min(0).default(0),
    })
    .default({ adults: 1, children: 0, infants: 0 }),
  message: z.string().trim().max(4000).optional(),
});

export const createEnquirySchema = z.discriminatedUnion('type', [contactEnquiry, bookingEnquiry]);

/* ---------- admin ---------- */

export const enquiryStatus = z.enum(['new', 'assigned', 'in_progress', 'quoted', 'won', 'lost']);

/**
 * `status` accepts a comma-separated list, so the board can ask for every open
 * stage in one request rather than one call per column.
 */
const statusFilter = z
  .string()
  .optional()
  .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined))
  .refine((list) => !list || list.every((s) => enquiryStatus.safeParse(s).success), {
    message: 'Unknown enquiry status.',
  });

export const enquiryListQuery = paginationQuery.extend({
  status: statusFilter,
  type: z.enum(['contact', 'booking']).optional(),
  /** An admin user id, or "me" for the caller, or "unassigned" for the pool. */
  assignee: z.union([objectId, z.enum(['me', 'unassigned'])]).optional(),
  /** Only enquiries whose follow-up date has passed. */
  overdue: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  q: searchQuery,
  sort: z
    .enum(['newest', 'oldest', 'name-asc', 'follow-up', 'oldest-open'])
    .optional(),
});

/** Bulk triage. Enquiry statuses are their own enum, not draft/published. */
export const bulkEnquirySchema = z.object({
  ids: z.array(objectId).min(1, 'Select at least one enquiry.').max(100),
  status: enquiryStatus,
});

export const bulkAssignSchema = z.object({
  ids: z.array(objectId).min(1, 'Select at least one enquiry.').max(100),
  /** Null hands them back to the unassigned pool. */
  assigneeId: objectId.nullable(),
});

/**
 * Editing the enquiry record itself. Status and assignment are deliberately
 * absent: both have their own endpoints, because both must append to the
 * activity log and a general-purpose PATCH makes that easy to bypass.
 */
export const updateEnquirySchema = z.object({
  adminNotes: z.string().trim().max(4000).optional(),
  followUpAt: z.coerce.date().nullable().optional(),
});

export const statusChangeSchema = z.object({
  status: enquiryStatus,
  /** Optional context, stored on the timeline entry. */
  note: z.string().trim().max(2000).optional(),
});

export const assignSchema = z.object({
  /** Null unassigns. Omitted means "assign to me" — see the controller. */
  assigneeId: objectId.nullable().optional(),
});

export const noteSchema = z.object({
  note: z.string().trim().min(1, 'A note cannot be empty.').max(4000),
});

/** Recording that someone actually reached the customer. */
export const contactedSchema = z.object({
  note: z.string().trim().max(2000).optional(),
  /** When to chase again. Null clears any existing reminder. */
  followUpAt: z.coerce.date().nullable().optional(),
});
