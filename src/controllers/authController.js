const Organization = require('../models/Organization');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const {
  signAuthToken,
  signInviteToken,
  verifyInviteToken,
} = require('../utils/jwt');

async function register(req, res) {
  const { orgName, name, email, password } = req.body || {};

  if (!orgName || !name || !email || !password) {
    throw new ApiError(400, 'orgName, name, email and password are required');
  }
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  const passwordHash = await User.hashPassword(password);

  const org = await Organization.create({ name: orgName });

  let user;
  try {
    user = await User.create({
      name,
      email,
      passwordHash,
      role: 'admin',
      organizationId: org._id,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'A user with that email already exists in this organization');
    }
    throw err;
  }

  const token = signAuthToken(user);
  res.status(201).json({ token, user: user.toSafeJSON() });
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    throw new ApiError(400, 'email and password are required');
  }

  // passwordHash is select:false, so explicitly request it for the comparison.
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    // Same message for both cases so we don't reveal which emails exist.
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signAuthToken(user);
  res.json({ token, user: user.toSafeJSON() });
}

/**
 * POST /api/auth/invite  (admin only)
 * Issues a signed invite token bound to this admin's organization. The invitee
 * redeems it at POST /api/auth/accept-invite to set their name + password.
 * Body: { email, role? }
 */
async function invite(req, res) {
  const { email, role = 'member' } = req.body || {};
  if (!email) {
    throw new ApiError(400, 'email is required');
  }
  if (!User.ROLES.includes(role)) {
    throw new ApiError(400, `role must be one of: ${User.ROLES.join(', ')}`);
  }

  const existing = await User.findOne({
    organizationId: req.orgId,
    email: email.toLowerCase(),
  });
  if (existing) {
    throw new ApiError(409, 'That user is already a member of this organization');
  }

  const inviteToken = signInviteToken({
    email: email.toLowerCase(),
    role,
    org: req.orgId.toString(),
    invitedBy: req.user._id.toString(),
  });

  res.status(201).json({
    inviteToken,
    // Surface what the token encodes so the admin can share it knowingly.
    invite: { email: email.toLowerCase(), role, organizationId: req.orgId },
  });
}

/**
 * POST /api/auth/accept-invite
 * Redeems an invite token and creates the member account, returning a JWT.
 * Body: { inviteToken, name, password }
 */
async function acceptInvite(req, res) {
  const { inviteToken, name, password } = req.body || {};
  if (!inviteToken || !name || !password) {
    throw new ApiError(400, 'inviteToken, name and password are required');
  }
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  let payload;
  try {
    payload = verifyInviteToken(inviteToken);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired invite token');
  }

  const org = await Organization.findById(payload.org);
  if (!org) {
    throw new ApiError(404, 'The inviting organization no longer exists');
  }

  const passwordHash = await User.hashPassword(password);

  let user;
  try {
    user = await User.create({
      name,
      email: payload.email,
      passwordHash,
      role: payload.role,
      organizationId: payload.org,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'That user already exists in this organization');
    }
    throw err;
  }

  const token = signAuthToken(user);
  res.status(201).json({ token, user: user.toSafeJSON() });
}

module.exports = { register, login, invite, acceptInvite };
