const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');
const authMiddleware = require('../middlewares/auth-middlewares');
const requireAccountingShopType = require('../middlewares/requireAccountingShopType');

// Apply middlewares to all routes in this router
router.use(authMiddleware);
router.use(requireAccountingShopType);


// Quotation Routes
router.post('/quotations', accountingController.createQuotation);
router.get('/quotations', accountingController.getQuotations);
router.get('/quotations/:id', accountingController.getQuotationById);
router.get('/quotations/:id/pdf', accountingController.getQuotationPDF);

// Invoice Routes
router.post('/invoices', accountingController.createInvoice);
router.get('/invoices', accountingController.getInvoices);
router.get('/invoices/:id', accountingController.getInvoiceById);
router.get('/invoices/:id/pdf', accountingController.getInvoicePDF);

// Credit/Debit Note Routes
router.post('/notes', accountingController.createNote);
router.get('/notes', accountingController.getNotes);

module.exports = router;
