const express = require('express');
const router = express.Router();
const {
  getSalesRegister,
  getPurchaseRegister,
  getStockValuation,
  getReceivablesAging
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenant');
const { requirePermission } = require('../middleware/rbac');

router.use(protect);
router.use(tenantContext);

router.get('/sales-register', requirePermission('reports', 'view'), getSalesRegister);
router.get('/purchase-register', requirePermission('reports', 'view'), getPurchaseRegister);
router.get('/stock-valuation', requirePermission('reports', 'view'), getStockValuation);
router.get('/receivables-aging', requirePermission('reports', 'view'), getReceivablesAging);

module.exports = router;
