const express = require('express');
const { body } = require('express-validator');
const { getStats, updateProfile, changePassword } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { avatarUpload } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/me/stats', getStats);

router.patch('/profile', avatarUpload.single('avatar'), updateProfile);

router.patch(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  changePassword
);

module.exports = router;
