import mongoose from 'mongoose';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import { uniqueSlug } from '../utils/slugify.js';

const { Schema, model } = mongoose;

export const COUNTRIES = ['Kenya', 'Tanzania', 'Uganda', 'Rwanda', 'Zanzibar'];

const imageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, required: true, trim: true },
  },
  { _id: false }
);

/** A park, reserve or sub-region shown as a card on the destination page. */
const parkSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, lowercase: true },
    blurb: { type: String, trim: true, maxlength: 240 },
    image: imageSchema,
    bestTime: { type: String, trim: true },
    highlights: [{ type: String, trim: true }],
  },
  { _id: false }
);

const destinationSchema = new Schema(
  {
    name: { type: String, required: [true, 'A destination needs a name.'], trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    country: { type: String, enum: COUNTRIES, required: true, index: true },

    tagline: { type: String, trim: true, maxlength: 180 },
    categoryLabel: { type: String, trim: true, default: 'Destination' },
    overview: { type: String, required: [true, 'An overview is required.'], trim: true },

    heroImage: { type: imageSchema, required: true },
    cardImage: { type: imageSchema, required: true },

    highlights: [{ type: String, trim: true }],
    bestTime: {
      months: [{ type: String, trim: true }],
      note: { type: String, trim: true },
    },

    parks: [parkSchema],

    featured: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    order: { type: Number, default: 0 },

    seo: {
      metaTitle: { type: String, trim: true, maxlength: 70 },
      metaDescription: { type: String, trim: true, maxlength: 180 },
      ogImage: { type: String, trim: true },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

destinationSchema.plugin(mongooseLeanVirtuals);

destinationSchema.index({ country: 1, status: 1, order: 1 });

destinationSchema.virtual('parkCount').get(function () {
  return this.parks?.length ?? 0;
});

destinationSchema.pre('validate', async function () {
  if (!this.slug && this.name) {
    this.slug = await uniqueSlug(this.constructor, this.name, this._id);
  }
  // Park slugs are only used as anchor targets, so a local slugify is enough.
  for (const park of this.parks ?? []) {
    if (!park.slug && park.name) {
      park.slug = park.name
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  }
});

export const Destination = model('Destination', destinationSchema);
