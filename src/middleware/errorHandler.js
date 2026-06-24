const ApiError = require('../utils/ApiError');

/** 404 for unmatched routes. */
function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Central error handler. Translates known error shapes (ApiError, Mongoose
 * validation, duplicate keys, bad JSON) into clean JSON and hides internals
 * for anything unexpected.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Known, client-safe errors.
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Mongoose validation.
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation failed', details });
  }

  // Duplicate key (e.g. email already used within an org).
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Resource already exists', keys: err.keyValue });
  }

  // Malformed JSON body.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  console.error('[error]', err);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { notFound, errorHandler };
