const express = require('express');
const router = express.Router();
const accountingController = require('../controllers/accountingController');

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
