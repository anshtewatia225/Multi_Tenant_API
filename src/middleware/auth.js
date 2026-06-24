const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAuthToken } = require('../utils/jwt');
const User = require('../models/User');
const Organization = require('../models/Organization');

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Missing or malformed Authorization header');
  }

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(401, 'User no longer exists');
  }

  const org = await Organization.findById(user.organizationId);
  if (!org) {
    throw new ApiError(401, 'Organization no longer exists');
  }

  req.user = user;
  req.org = org;
  next();
});

function requireMember(req, res, next) {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }
  if (req.user.role !== 'admin') {
    return next(new ApiError(403, 'Admin role required'));
  }
  next();
}

module.exports = { authenticate, requireMember, requireAdmin };
