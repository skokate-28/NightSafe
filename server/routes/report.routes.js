const express = require('express');
const { body } = require('express-validator');
const {
  createReport,
  getReports,
  getReportById,
  voteReport,
  deleteReport,
} = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');
const validate = require('../middleware/validate.middleware');

const router = express.Router();

const categories = [
  'poorly_lit', 'harassment', 'theft', 'assault',
  'suspicious_activity', 'unsafe_infrastructure', 'other',
];

router.get('/', getReports);

router.get('/:id', getReportById);

router.post(
  '/',
  authenticate,
  upload.single('photo'),
  [
    body('lat').custom((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= -90 && parseFloat(v) <= 90).withMessage('Valid latitude required'),
    body('lng').custom((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= -180 && parseFloat(v) <= 180).withMessage('Valid longitude required'),
    body('category').isIn(categories).withMessage('Invalid category'),
    body('severity').custom((v) => {
      const n = parseInt(v, 10);
      return !isNaN(n) && n >= 1 && n <= 5;
    }).withMessage('Severity must be 1-5'),
    body('description').optional().isString(),
    body('hour_of_day').optional().isInt({ min: 0, max: 23 }),
  ],
  validate,
  createReport
);

router.post(
  '/:id/vote',
  authenticate,
  [body('vote_type').isIn(['up', 'down']).withMessage('vote_type must be up or down')],
  validate,
  voteReport
);

router.delete('/:id', authenticate, deleteReport);

module.exports = router;
