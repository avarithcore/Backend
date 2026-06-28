/**
 * ROUTES WAITLIST - Definisi endpoint API, KONTOL!
 * Udah gw lengkapi dengan validasi dan middleware.
 * Jangan lupa pake auth untuk endpoint yang sensitif, BABI!
 */

const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const waitlistController = require('../controllers/waitlist.controller');
const rateLimit = require('express-rate-limit');

// Rate limiter khusus untuk register (lebih ketat), GOBLOK!
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // maksimal 5 request per IP per 15 menit
  message: 'Too many registration attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Route: Register email
router.post(
  '/register',
  registerLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address, BABI!')
      .normalizeEmail()
      .trim()
      .toLowerCase(),
    body('name')
      .optional()
      .isString()
      .withMessage('Name must be a string, GOBLOK!')
      .isLength({ max: 100 })
      .withMessage('Name cannot exceed 100 characters, MEMEK!')
      .trim(),
    body('source')
      .optional()
      .isIn(['landing', 'referral', 'social', 'other'])
      .withMessage('Invalid source, KONTOL!')
  ],
  waitlistController.register
);

// Route: Verify email via token
router.get(
  '/verify/:token',
  [
    param('token')
      .isUUID(4)
      .withMessage('Invalid token format, BANGSAT!')
  ],
  waitlistController.verify
);

// Route: Check status
router.get(
  '/status/:email',
  [
    param('email')
      .isEmail()
      .withMessage('Invalid email format, GOBLOK!')
      .normalizeEmail()
      .trim()
      .toLowerCase()
  ],
  waitlistController.status
);

// Route: Export data (admin only - butuh auth tambahan)
router.get(
  '/export',
  // TODO: tambahkan middleware admin auth, KONTOL!
  waitlistController.export
);

// Route: Delete entry (admin only)
router.delete(
  '/:id',
  // TODO: tambahkan middleware admin auth, MEMEK!
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid entry ID format, BABI!')
  ],
  waitlistController.delete
);

module.exports = router;