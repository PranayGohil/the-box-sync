const express = require('express');
const router = express.Router();
const { getGSTSummary, getTDS, createTDSSection, reconcileGST } = require('../controllers/taxController');
const { protect } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenant');
const { requirePermission } = require('../middleware/rbac');

router.use(protect);
router.use(tenantContext);

router.get('/gst-summary', requirePermission('tax_gst', 'view'), getGSTSummary);
router.get('/tds', requirePermission('tax_tds', 'view'), getTDS);
router.post('/tds/sections', requirePermission('tax_tds', 'create'), createTDSSection);
router.post('/gst-reconcile', requirePermission('tax_gst', 'view'), reconcileGST);

module.exports = router;
