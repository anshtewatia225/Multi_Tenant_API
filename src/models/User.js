const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['admin', 'member'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default queries
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'member',
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

// Email is unique *per organization*, not globally — two orgs may share an email.
userSchema.index({ organizationId: 1, email: 1 }, { unique: true });

userSchema.statics.ROLES = ROLES;

/**
 * Hashes a plaintext password. Kept as a static so controllers don't
 * import bcrypt directly and the cost factor lives in one place.
 */
userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
};

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    organizationId: this.organizationId,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
