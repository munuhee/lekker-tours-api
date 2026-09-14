import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const FAQ_GROUPS = ['general', 'booking', 'travel', 'payment'];

const faqSchema = new Schema(
  {
    question: { type: String, required: [true, 'A question is required.'], trim: true, maxlength: 240 },
    answer: { type: String, required: [true, 'An answer is required.'], trim: true },
    group: { type: String, enum: FAQ_GROUPS, default: 'general', index: true },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
  },
  { timestamps: true }
);

faqSchema.index({ status: 1, group: 1, order: 1 });

export const FAQ = model('FAQ', faqSchema);
