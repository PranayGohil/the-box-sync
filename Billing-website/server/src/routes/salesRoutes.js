const express = require('express');
const router = express.Router();
const {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  convertQuotationToSO,
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  updateSalesOrder,
  getDeliveryChallans,
  getDeliveryChallanById,
  createDeliveryChallan
} = require('../controllers/salesDocsController');
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
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
router.get('/quotations/:id', requirePermission('quotations', 'view'), getQuotationById);
router.post('/quotations', requirePermission('quotations', 'create'), checkFinancialYearLock, createQuotation);
router.put('/quotations/:id', requirePermission('quotations', 'edit'), checkFinancialYearLock, updateQuotation);
router.post('/quotations/:id/convert-so', requirePermission('sales_orders', 'create'), convertQuotationToSO);

// Sales Orders
router.get('/orders', requirePermission('sales_orders', 'view'), getSalesOrders);
router.get('/orders/:id', requirePermission('sales_orders', 'view'), getSalesOrderById);
router.post('/orders', requirePermission('sales_orders', 'create'), checkFinancialYearLock, createSalesOrder);
router.put('/orders/:id', requirePermission('sales_orders', 'edit'), checkFinancialYearLock, updateSalesOrder);

// Delivery Challans
router.get('/challans', requirePermission('delivery_challans', 'view'), getDeliveryChallans);
router.get('/challans/:id', requirePermission('delivery_challans', 'view'), getDeliveryChallanById);
router.post('/challans', requirePermission('delivery_challans', 'create'), checkFinancialYearLock, createDeliveryChallan);

// Invoices
router.get('/invoices', requirePermission('invoices', 'view'), getInvoices);
router.get('/invoices/:id', requirePermission('invoices', 'view'), getInvoiceById);
router.post('/invoices', requirePermission('invoices', 'create'), checkFinancialYearLock, createInvoice);
router.put('/invoices/:id', requirePermission('invoices', 'edit'), checkFinancialYearLock, updateInvoice);
router.post('/invoices/pos-checkout', requirePermission('invoices', 'create'), checkFinancialYearLock, posCheckout);
router.post('/invoices/:id/cancel', requirePermission('invoices', 'cancel'), checkFinancialYearLock, cancelInvoice);

// Sales Returns & Credit Notes
router.get('/returns', requirePermission('sales_returns', 'view'), getSalesReturns);
router.post('/returns', requirePermission('sales_returns', 'create'), checkFinancialYearLock, createSalesReturn);
router.get('/credit-notes', requirePermission('credit_notes', 'view'), getCreditNotes);

module.exports = router;
