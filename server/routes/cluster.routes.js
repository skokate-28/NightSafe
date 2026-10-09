const express = require('express');
const { getAllClusters, recomputeClusters } = require('../controllers/cluster.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getAllClusters);
router.post('/recompute', authenticate, recomputeClusters);

module.exports = router;
