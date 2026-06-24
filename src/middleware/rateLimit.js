const rateLimit = require('express-rate-limit');
const Organization = require('../models/Organization');

const HOUR_MS = 60 * 60 * 1000;

// Requests allowed per hour, per organization, by plan.
const PLAN_LIMITS = {
  free: 100,
  pro: 1000,
  enterprise: Infinity, // unlimited
};

// Keyed per org so all members share one budget. Must run after authenticate + orgScope.
const planRateLimiter = rateLimit({
  windowMs: HOUR_MS,
  standardHeaders: true,
  legacyHeaders: false,

  // One bucket per tenant rather than per IP.
  keyGenerator: (req) => (req.orgId ? req.orgId.toString() : req.ip),

  // Enterprise = unlimited.
  skip: (req) => req.org && req.org.plan === 'enterprise',

  // Limit is resolved per request from the caller's current plan.
  max: (req) => {
    const plan = req.org ? req.org.plan : 'free';
    return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  },

  message: {
    error: 'Rate limit exceeded for your plan. Upgrade for a higher quota.',
  },
});

function trackUsage(req, res, next) {
  if (req.orgId) {
    Organization.updateOne({ _id: req.orgId }, { $inc: { requestCount: 1 } }).catch(
      (err) => console.warn('[usage] failed to increment requestCount:', err.message)
    );
  }
  next();
}

module.exports = { planRateLimiter, trackUsage, PLAN_LIMITS };
