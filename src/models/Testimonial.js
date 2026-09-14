import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const testimonialSchema = new Schema(
  {
    authorName: { type: String, required: [true, 'A reviewer name is required.'], trim: true, maxlength: 120 },
    authorLocation: { type: String, trim: true, maxlength: 120 },
    avatar: {
      url: { type: String, trim: true },
      alt: { type: String, trim: true },
    },

    quote: {
      type: String,
      required: [true, 'The testimonial text is required.'],
      trim: true,
      maxlength: [600, 'Testimonials must be 600 characters or fewer.'],
    },

    rating: { type: Number, min: 1, max: 5, default: 5 },
    tour: { type: Schema.Types.ObjectId, ref: 'Tour' },
    tourName: { type: String, trim: true },
    travelledOn: { type: Date },

    featured: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

testimonialSchema.index({ status: 1, featured: -1, order: 1 });

export const Testimonial = model('Testimonial', testimonialSchema);
