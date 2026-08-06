const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');
const authMiddleware = require('../middlewares/auth-middlewares');
const requireAccountingShopType = require('../middlewares/requireAccountingShopType');

// Apply auth + shop-type checks to all accounting routes
router.use(authMiddleware);
router.use(requireAccountingShopType);

// Number Series Configuration
router.get('/number-series', accountingController.getNumberSeries);
router.post('/number-series', accountingController.updateNumberSeries);

// Quotation Routes
router.post('/quotations', accountingController.createQuotation);
router.get('/quotations', accountingController.getQuotations);
router.get('/quotations/:id', accountingController.getQuotationById);
router.get('/quotations/:id/pdf', accountingController.getQuotationPDF);

// Invoice Routes
router.post('/invoices', accountingController.createInvoice);
router.get('/invoices', accountingController.getInvoices);
router.get('/invoices/:id', accountingController.getInvoiceById);
router.put('/invoices/:id', accountingController.updateInvoice);
router.delete('/invoices/:id', accountingController.deleteInvoice);
router.get('/invoices/:id/pdf', accountingController.getInvoicePDF);

// Credit/Debit Note Routes
router.post('/notes', accountingController.createNote);
router.get('/notes', accountingController.getNotes);
router.get('/notes/:id/pdf', accountingController.getNotePDF);

// Sales Order Routes
router.post('/sales-orders', accountingController.createSalesOrder);
router.get('/sales-orders', accountingController.getSalesOrders);
router.get('/sales-orders/:id', accountingController.getSalesOrderById);
router.get('/sales-orders/:id/pdf', accountingController.getSalesOrderPDF);

// Purchase Order Routes
router.post('/purchase-orders', accountingController.createPurchaseOrder);
router.get('/purchase-orders', accountingController.getPurchaseOrders);
router.get('/purchase-orders/:id', accountingController.getPurchaseOrderById);
router.put('/purchase-orders/:id/status', accountingController.updatePurchaseOrderStatus);
router.post('/purchase-orders/:id/receive', accountingController.receivePurchaseItems);
router.get('/purchase-orders/:id/pdf', accountingController.getPurchaseOrderPDF);

// GST Reports
router.get('/reports/gst', accountingController.getGSTReports);

module.exports = router;
