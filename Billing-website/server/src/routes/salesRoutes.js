const express = require('express');
const router = express.Router();
const {
  getQuotations,
  createQuotation,
  convertQuotationToSO,
  getSalesOrders,
  createSalesOrder,
  getDeliveryChallans,
  createDeliveryChallan
} = require('../controllers/salesDocsController');
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  posCheckout,
  cancelInvoice
} = require('../controllers/invoiceController');
const {
  getSalesReturns,
  createSalesReturn,
  getCreditNotes
} = require('../controllers/salesReturnController');
const { protect } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenant');
const { requirePermission, checkFinancialYearLock } = require('../middleware/rbac');

router.use(protect);
router.use(tenantContext);

// Quotations
router.get('/quotations', requirePermission('quotations', 'view'), getQuotations);
router.post('/quotations', requirePermission('quotations', 'create'), checkFinancialYearLock, createQuotation);
router.post('/quotations/:id/convert-so', requirePermission('sales_orders', 'create'), convertQuotationToSO);

// Sales Orders
router.get('/orders', requirePermission('sales_orders', 'view'), getSalesOrders);
router.post('/orders', requirePermission('sales_orders', 'create'), checkFinancialYearLock, createSalesOrder);

// Delivery Challans
router.get('/challans', requirePermission('delivery_challans', 'view'), getDeliveryChallans);
router.post('/challans', requirePermission('delivery_challans', 'create'), checkFinancialYearLock, createDeliveryChallan);

// Invoices
router.get('/invoices', requirePermission('invoices', 'view'), getInvoices);
router.get('/invoices/:id', requirePermission('invoices', 'view'), getInvoiceById);
router.post('/invoices', requirePermission('invoices', 'create'), checkFinancialYearLock, createInvoice);
router.post('/invoices/pos-checkout', requirePermission('invoices', 'create'), checkFinancialYearLock, posCheckout);
router.post('/invoices/:id/cancel', requirePermission('invoices', 'cancel'), checkFinancialYearLock, cancelInvoice);

// Sales Returns & Credit Notes
router.get('/returns', requirePermission('sales_returns', 'view'), getSalesReturns);
router.post('/returns', requirePermission('sales_returns', 'create'), checkFinancialYearLock, createSalesReturn);
router.get('/credit-notes', requirePermission('credit_notes', 'view'), getCreditNotes);

module.exports = router;
