import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema, model } = mongoose;

const adminUserSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'An email address is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address.'],
    },
    // select:false keeps the hash out of every ordinary query result.
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, trim: true, default: 'Administrator' },
    role: { type: String, enum: ['admin', 'editor'], default: 'admin' },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

// Mongoose 9: pre-hooks no longer receive `next` — returning/resolving continues the chain.
adminUserSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  // Skip if the value already looks like a bcrypt digest (re-save of a loaded doc).
  if (/^\$2[aby]\$\d{2}\$/.test(this.passwordHash)) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

adminUserSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

export const AdminUser = model('AdminUser', adminUserSchema);
