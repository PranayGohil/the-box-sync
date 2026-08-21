const express = require('express');
const router = express.Router();
const {
  getPurchaseOrders,
  createPurchaseOrder,
  convertPOToGRN,
  getGoodsReceipts,
  getPurchaseBills,
  createPurchaseBill,
  cancelPurchaseBill,
  getPurchaseReturns,
  createPurchaseReturn,
  getDebitNotes
} = require('../controllers/purchaseDocsController');
const { protect } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenant');
const { requirePermission, checkFinancialYearLock } = require('../middleware/rbac');

router.use(protect);
router.use(tenantContext);

// Purchase Orders
router.get('/orders', requirePermission('purchase_orders', 'view'), getPurchaseOrders);
router.post('/orders', requirePermission('purchase_orders', 'create'), checkFinancialYearLock, createPurchaseOrder);
router.post('/orders/:id/convert-grn', requirePermission('goods_receipt', 'create'), convertPOToGRN);

// GRN
router.get('/grn', requirePermission('goods_receipt', 'view'), getGoodsReceipts);

// Purchase Bills
router.get('/bills', requirePermission('purchase_bills', 'view'), getPurchaseBills);
router.post('/bills', requirePermission('purchase_bills', 'create'), checkFinancialYearLock, createPurchaseBill);
router.post('/bills/:id/cancel', requirePermission('purchase_bills', 'cancel'), checkFinancialYearLock, cancelPurchaseBill);

// Purchase Returns & Debit Notes
router.get('/returns', requirePermission('purchase_returns', 'view'), getPurchaseReturns);
router.post('/returns', requirePermission('purchase_returns', 'create'), checkFinancialYearLock, createPurchaseReturn);
router.get('/debit-notes', requirePermission('debit_notes', 'view'), getDebitNotes);

module.exports = router;
