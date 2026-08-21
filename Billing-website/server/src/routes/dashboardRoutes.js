const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenant');

router.use(protect);
router.use(tenantContext);

router.get('/', getDashboardStats);

module.exports = router;
