const express = require('express');
const router = express.Router();
const { getAuditLogs, getNotifications, markNotificationRead, globalSearch } = require('../controllers/settingsController');
const { exportData } = require('../controllers/dataTransferController');
const { protect } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenant');
const { requirePermission } = require('../middleware/rbac');

router.use(protect);
router.use(tenantContext);

router.get('/audit-logs', requirePermission('audit_logs', 'view'), getAuditLogs);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.get('/search', globalSearch);
router.get('/export/:entityType', requirePermission('reports', 'export'), exportData);

module.exports = router;
