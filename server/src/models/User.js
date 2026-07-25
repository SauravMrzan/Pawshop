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
    // select: false — excluded from queries unless explicitly requested
    mfaSecret: {
      type: String,
      select: false,
    },
    // Per-account lockout — authLimiter alone only caps attempts per IP
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    // Bumped to invalidate every outstanding session JWT at once (logout,
    // password change) — requireAuth rejects any token whose embedded
    // tokenVersion doesn't match this. Stateless JWTs can't otherwise be
    // revoked before they expire.
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    strict: true,
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const User = mongoose.model('User', userSchema);
