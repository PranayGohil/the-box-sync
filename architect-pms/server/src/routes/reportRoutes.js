const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/status-summary', reportController.getStatusSummary);
router.get('/zone-summary', reportController.getZoneSummary);
router.get('/turnaround-time', reportController.getTurnaroundTime);
router.get('/workload', reportController.getWorkloadSummary);

module.exports = router;
