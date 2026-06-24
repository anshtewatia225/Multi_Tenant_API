const Resource = require('../models/Resource');
const ApiError = require('../utils/ApiError');

/**
 * GET /api/resources  (members)
 * Returns only the calling tenant's resources.
 */
async function list(req, res) {
  const resources = await Resource.find(req.scope()).sort({ createdAt: -1 });
  res.json({ resources });
}

/**
 * POST /api/resources  (members)
 * Body: { title, data? }
 */
async function create(req, res) {
  const { title, data } = req.body || {};
  if (!title) {
    throw new ApiError(400, 'title is required');
  }

  // req.stamp forces organizationId + createdBy so callers can't spoof either.
  const resource = await Resource.create(req.stamp({ title, data: data ?? {} }));
  res.status(201).json({ resource });
}

/**
 * PUT /api/resources/:id  (admin OR the resource owner)
 * Body: { title?, data? }
 */
async function update(req, res) {
  // Scoped lookup: a foreign org's id simply won't be found.
  const resource = await Resource.findOne(req.scope({ _id: req.params.id }));
  if (!resource) {
    throw new ApiError(404, 'Resource not found');
  }

  const isOwner = resource.createdBy.equals(req.user._id);
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && !isOwner) {
    throw new ApiError(403, 'Only an admin or the resource owner can update this');
  }

  if (req.body.title !== undefined) resource.title = req.body.title;
  if (req.body.data !== undefined) resource.data = req.body.data;

  await resource.save();
  res.json({ resource });
}

/**
 * DELETE /api/resources/:id  (admin only)
 */
async function remove(req, res) {
  const resource = await Resource.findOneAndDelete(req.scope({ _id: req.params.id }));
  if (!resource) {
    throw new ApiError(404, 'Resource not found');
  }
  res.json({ deleted: resource._id });
}

module.exports = { list, create, update, remove };
