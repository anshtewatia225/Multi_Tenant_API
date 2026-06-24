const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { PLAN_LIMITS } = require('../middleware/rateLimit');

/**
 * GET /api/org/usage  (admin only)
 * Returns the org's plan, request count, hourly limit, and member list.
 */
async function usage(req, res) {
  const members = await User.find(req.scope()).sort({ createdAt: 1 });

  const limit = PLAN_LIMITS[req.org.plan] ?? PLAN_LIMITS.free;

  res.json({
    organization: {
      id: req.org._id,
      name: req.org.name,
      plan: req.org.plan,
      createdAt: req.org.createdAt,
    },
    usage: {
      requestCount: req.org.requestCount,
      hourlyLimit: limit === Infinity ? 'unlimited' : limit,
    },
    memberCount: members.length,
    members: members.map((m) => m.toSafeJSON()),
  });
}

/**
 * PATCH /api/org/plan  (admin only)
 * Body: { plan: 'free' | 'pro' | 'enterprise' }
 */
async function changePlan(req, res) {
  const { plan } = req.body || {};
  const Organization = req.org.constructor;

  if (!plan || !Organization.PLANS.includes(plan)) {
    throw new ApiError(400, `plan must be one of: ${Organization.PLANS.join(', ')}`);
  }

  req.org.plan = plan;
  await req.org.save();

  res.json({
    organization: {
      id: req.org._id,
      name: req.org.name,
      plan: req.org.plan,
    },
  });
}

module.exports = { usage, changePlan };
