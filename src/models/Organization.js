const mongoose = require('mongoose');

const PLANS = ['free', 'pro', 'enterprise'];

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: 120,
    },
    plan: {
      type: String,
      enum: PLANS,
      default: 'free',
    },
    // Rolling counter used by the plan-based rate limiter for usage reporting.
    requestCount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

organizationSchema.statics.PLANS = PLANS;

module.exports = mongoose.model('Organization', organizationSchema);
