const ApiError = require('../utils/ApiError');

// Injects req.orgId, req.scope() (read filter), and req.stamp() (write filter)
// so every controller query is automatically scoped to the caller's org.
function orgScope(req, res, next) {
  if (!req.user || !req.user.organizationId) {
    return next(new ApiError(401, 'Authentication required'));
  }

  req.orgId = req.user.organizationId;

  // Overwrite rather than spread-last so a client-supplied organizationId is ignored.
  req.scope = (filter = {}) => ({ ...filter, organizationId: req.orgId });

  req.stamp = (doc = {}) => ({
    ...doc,
    organizationId: req.orgId,
    createdBy: req.user._id,
  });

  next();
}

module.exports = orgScope;
