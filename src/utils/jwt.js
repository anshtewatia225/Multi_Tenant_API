const jwt = require('jsonwebtoken');

function signAuthToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), org: user.organizationId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function verifyAuthToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function signInviteToken(payload) {
  return jwt.sign(payload, process.env.INVITE_SECRET, {
    expiresIn: process.env.INVITE_EXPIRES_IN || '2d',
  });
}

function verifyInviteToken(token) {
  return jwt.verify(token, process.env.INVITE_SECRET);
}

module.exports = {
  signAuthToken,
  verifyAuthToken,
  signInviteToken,
  verifyInviteToken,
};
