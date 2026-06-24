const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, requireAdmin } = require('../middleware/auth');
const orgScope = require('../middleware/orgScope');
const authController = require('../controllers/authController');

const router = express.Router();

// Public
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/accept-invite', asyncHandler(authController.acceptInvite));

// Admin only — issue an invite scoped to the admin's org.
router.post(
  '/invite',
  authenticate,
  orgScope,
  requireAdmin,
  asyncHandler(authController.invite)
);

module.exports = router;
