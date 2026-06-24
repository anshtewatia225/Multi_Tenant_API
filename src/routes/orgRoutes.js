const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, requireAdmin } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const { planRateLimiter, trackUsage } = require('../middleware/rateLimit');
const orgController = require('../controllers/orgController');

const router = express.Router();

router.use(authenticate, orgScope, planRateLimiter, trackUsage, requireAdmin);

router.get('/usage', asyncHandler(orgController.usage));
router.patch('/plan', asyncHandler(orgController.changePlan));

module.exports = router;
