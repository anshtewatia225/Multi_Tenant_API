const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, requireMember, requireAdmin } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const { planRateLimiter, trackUsage } = require('../middleware/rateLimit');
const resourceController = require('../controllers/resourceController');

const router = express.Router();

// Every resource route is authenticated, tenant-scoped, and rate limited by plan.
router.use(authenticate, orgScope, planRateLimiter, trackUsage);

router.get('/', requireMember, asyncHandler(resourceController.list));
router.post('/', requireMember, asyncHandler(resourceController.create));

// Ownership/admin check lives inside the controller (needs the loaded doc).
router.put('/:id', requireMember, asyncHandler(resourceController.update));

router.delete('/:id', requireAdmin, asyncHandler(resourceController.remove));

module.exports = router;
