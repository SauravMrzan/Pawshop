import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    // select: false — never included in a query unless explicitly requested
    // (.select('+mfaSecret')), same reasoning as keeping it out of API responses.
    mfaSecret: {
      type: String,
      select: false,
    },
  },
  {
    strict: true,
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const User = mongoose.model('User', userSchema);
