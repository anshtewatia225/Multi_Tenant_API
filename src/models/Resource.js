const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    // Free-form payload for the tenant's data. Mixed lets callers store any JSON.
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

// Most reads are "all resources for this org", so index the tenant key.
resourceSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('Resource', resourceSchema);
