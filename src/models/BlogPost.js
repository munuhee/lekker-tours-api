import mongoose from 'mongoose';
import { uniqueSlug } from '../utils/slugify.js';

const { Schema, model } = mongoose;

const blogPostSchema = new Schema(
  {
    title: { type: String, required: [true, 'A post needs a title.'], trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    excerpt: { type: String, required: true, trim: true, maxlength: 300 },
    content: { type: String, required: [true, 'Post content is required.'] },

    coverImage: {
      url: { type: String, required: true, trim: true },
      alt: { type: String, required: true, trim: true },
    },

    author: {
      name: { type: String, default: 'Lekker Tours', trim: true },
      avatar: { type: String, trim: true },
    },

    tags: [{ type: String, trim: true, lowercase: true, index: true }],
    readingMinutes: { type: Number, min: 1, default: 4 },
    publishedAt: { type: Date, default: Date.now, index: true },

    featured: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },

    seo: {
      metaTitle: { type: String, trim: true, maxlength: 70 },
      metaDescription: { type: String, trim: true, maxlength: 180 },
      ogImage: { type: String, trim: true },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

blogPostSchema.index({ status: 1, publishedAt: -1 });

blogPostSchema.pre('validate', async function () {
  if (!this.slug && this.title) {
    this.slug = await uniqueSlug(this.constructor, this.title, this._id);
  }
  // Estimate reading time from the body when the editor leaves it blank.
  if (!this.readingMinutes && this.content) {
    const words = this.content.trim().split(/\s+/).length;
    this.readingMinutes = Math.max(1, Math.round(words / 200));
  }
});

export const BlogPost = model('BlogPost', blogPostSchema);
