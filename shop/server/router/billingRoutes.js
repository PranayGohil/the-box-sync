const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

// Parties
router.post('/party', billingController.createParty);
router.get('/party', billingController.getParties);

// Products
router.post('/product', billingController.createProduct);
router.get('/product', billingController.getProducts);

// Documents (Invoices, Quotations, Notes)
router.post('/document', billingController.createDocument);
router.get('/document/:id/pdf', billingController.getDocumentPDF);

module.exports = router;
