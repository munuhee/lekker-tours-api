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

export const enquiryListQuery = paginationQuery.extend({
  status: z.enum(['new', 'read', 'responded', 'archived']).optional(),
  type: z.enum(['contact', 'booking']).optional(),
  q: searchQuery,
  sort: z.enum(['newest', 'oldest', 'name-asc']).optional(),
});

/** Bulk triage. Enquiry statuses are their own enum, not draft/published. */
export const bulkEnquirySchema = z.object({
  ids: z.array(objectId).min(1, 'Select at least one enquiry.').max(100),
  status: z.enum(['new', 'read', 'responded', 'archived']),
});

export const updateEnquirySchema = z.object({
  status: z.enum(['new', 'read', 'responded', 'archived']).optional(),
  adminNotes: z.string().trim().max(4000).optional(),
});
