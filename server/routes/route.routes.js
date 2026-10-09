const express = require('express');
const { body } = require('express-validator');
const { computeRoute, getRouteHistory } = require('../controllers/route.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

const router = express.Router();

router.use(authenticate);

router.post(
  '/compute',
  [
    body('originLat').isFloat({ min: -90, max: 90 }),
    body('originLng').isFloat({ min: -180, max: 180 }),
    body('destLat').isFloat({ min: -90, max: 90 }),
    body('destLng').isFloat({ min: -180, max: 180 }),
  ],
  validate,
  computeRoute
);

router.get('/history', getRouteHistory);

module.exports = router;
