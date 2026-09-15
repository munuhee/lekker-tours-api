import mongoose from 'mongoose';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import { uniqueSlug } from '../utils/slugify.js';

const { Schema, model } = mongoose;

const imageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, required: true, trim: true },
    caption: { type: String, trim: true },
  },
  { _id: false }
);

const itineraryDaySchema = new Schema(
  {
    day: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    activities: [{ type: String, trim: true }],
    meals: [{ type: String, enum: ['Breakfast', 'Lunch', 'Dinner'] }],
    accommodation: { type: String, trim: true },
  },
  { _id: false }
);

const tourSchema = new Schema(
  {
    title: { type: String, required: [true, 'A tour needs a title.'], trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    summary: {
      type: String,
      required: [true, 'A short summary is required.'],
      trim: true,
      maxlength: [300, 'Summary must be 300 characters or fewer.'],
    },
    description: { type: String, required: [true, 'A full description is required.'], trim: true },

    priceFrom: { type: Number, required: [true, 'A starting price is required.'], min: 0 },
    currency: { type: String, default: 'KES', uppercase: true, maxlength: 3 },

    durationDays: { type: Number, required: true, min: 1, max: 60 },
    durationNights: { type: Number, min: 0, max: 60 },
    groupSizeMax: { type: Number, default: 12, min: 1 },
    difficulty: {
      type: String,
      enum: ['easy', 'moderate', 'challenging'],
      default: 'moderate',
    },

    rating: { type: Number, min: 0, max: 5, default: 4.8 },
    reviewCount: { type: Number, min: 0, default: 0 },

    destination: { type: Schema.Types.ObjectId, ref: 'Destination', index: true },
    countries: [{ type: String, enum: ['Kenya', 'Tanzania', 'Uganda', 'Rwanda', 'Zanzibar'] }],

    highlights: [{ type: String, trim: true }],
    itinerary: [itineraryDaySchema],
    inclusions: [{ type: String, trim: true }],
    exclusions: [{ type: String, trim: true }],

    heroImage: { type: imageSchema, required: true },
    gallery: [imageSchema],

    featured: { type: Boolean, default: false, index: true },
    bestSelling: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    order: { type: Number, default: 0 },

    seo: {
      metaTitle: { type: String, trim: true, maxlength: 70 },
      metaDescription: { type: String, trim: true, maxlength: 180 },
      ogImage: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
    discriminatorKey: 'category',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Without this plugin, `.lean({ virtuals: true })` is silently ignored and
// durationLabel comes back undefined on every list and detail response.
tourSchema.plugin(mongooseLeanVirtuals);

tourSchema.index({ status: 1, featured: -1, order: 1 });
tourSchema.index({ category: 1, status: 1 });
tourSchema.index({ title: 'text', summary: 'text', highlights: 'text' });

tourSchema.virtual('durationLabel').get(function () {
  const nights = this.durationNights ?? Math.max(0, this.durationDays - 1);
  return `${this.durationDays} Day${this.durationDays === 1 ? '' : 's'} / ${nights} Night${nights === 1 ? '' : 's'}`;
});

// Mongoose 9: pre-hooks take no `next` callback — resolving the promise continues the chain.
tourSchema.pre('validate', async function () {
  if (!this.slug && this.title) {
    this.slug = await uniqueSlug(this.constructor, this.title, this._id);
  }
  if (this.durationNights == null && this.durationDays != null) {
    this.durationNights = Math.max(0, this.durationDays - 1);
  }
});

export const Tour = model('Tour', tourSchema);

/** Multi-day flagship journeys. */
export const SafariExpedition = Tour.discriminator(
  'SafariExpedition',
  new Schema(
    {
      parks: [{ type: String, trim: true }],
      gameDriveCount: { type: Number, min: 0 },
      conservancyFeesIncluded: { type: Boolean, default: true },
    },
    { _id: false }
  )
);

/** Short trips departing Nairobi. */
export const WeekendEscape = Tour.discriminator(
  'WeekendEscape',
  new Schema(
    {
      departsFrom: { type: String, default: 'Nairobi', trim: true },
      weekendDates: [{ type: Date }],
    },
    { _id: false }
  )
);
