import mongoose from 'mongoose';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';

const { Schema, model } = mongoose;

export const EXPEDITION_INTERESTS = ['Big Five Safaris', 'Weekend Escape', 'East Africa Tours'];
export const ENQUIRY_STATUSES = ['new', 'read', 'responded', 'archived'];

/**
 * One collection for both the contact form and the per-tour booking form;
 * `type` says which shape the submission took.
 */
const enquirySchema = new Schema(
  {
    type: { type: String, enum: ['contact', 'booking'], required: true, index: true },

    name: { type: String, required: [true, 'Your name is required.'], trim: true, maxlength: 120 },
    email: {
      type: String,
      required: [true, 'An email address is required.'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address.'],
    },
    phone: { type: String, trim: true, maxlength: 40 },

    // Contact-form fields, mirroring lekkertours.com/contact.
    expeditionInterest: { type: String, enum: EXPEDITION_INTERESTS },
    budgetUSD: { type: Number, min: 0 },
    message: { type: String, trim: true, maxlength: 4000 },

    // Booking-form fields, submitted from a tour detail page.
    tour: { type: Schema.Types.ObjectId, ref: 'Tour' },
    tourTitle: { type: String, trim: true },
    travelDate: { type: Date },
    guests: {
      adults: { type: Number, min: 1, default: 1 },
      children: { type: Number, min: 0, default: 0 },
      infants: { type: Number, min: 0, default: 0 },
    },

    status: { type: String, enum: ENQUIRY_STATUSES, default: 'new', index: true },
    adminNotes: { type: String, trim: true, maxlength: 4000 },
    source: { type: String, default: 'website', trim: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Required for totalGuests to survive .lean({ virtuals: true }) in the inbox listing.
enquirySchema.plugin(mongooseLeanVirtuals);

enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ type: 1, createdAt: -1 });

enquirySchema.virtual('totalGuests').get(function () {
  if (this.type !== 'booking') return null;
  const { adults = 0, children = 0, infants = 0 } = this.guests ?? {};
  return adults + children + infants;
});

export const Enquiry = model('Enquiry', enquirySchema);
