const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const CreditDebitNote = require('../models/CreditDebitNote');
const { generatePDF } = require('../utils/pdfGenerator');


// Quotation Controllers
exports.createQuotation = async (req, res) => {
  try {
    const quotation = new Quotation(req.body);
    // Calculation of totals should ideally be verified here
    await quotation.save();
    res.status(201).json({ success: true, data: quotation });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getQuotations = async (req, res) => {
  try {
    const { shopId } = req.query;
    const filter = shopId ? { shopId } : {};
    const quotations = await Quotation.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: quotations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getQuotationPDF = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate('shopId');
    if (!quotation) return res.status(404).json({ success: false, message: 'Not found' });
    
    // We pass data object and templateName 'quotation'
    const pdfBuffer = await generatePDF({ quotation, shop: quotation.shopId }, 'quotation');
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// Invoice Controllers
exports.createInvoice = async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    // TDS and total validation
    await invoice.save();
    
    // If it was created from a quote, update quote status
    if (invoice.quotationId) {
      await Quotation.findByIdAndUpdate(invoice.quotationId, { status: 'INVOICED' });
    }

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const { shopId } = req.query;
    const filter = shopId ? { shopId } : {};
    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('shopId');
    if (!invoice) return res.status(404).json({ success: false, message: 'Not found' });
    
    const pdfBuffer = await generatePDF({ invoice, shop: invoice.shopId }, 'invoice');
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// Credit/Debit Note Controllers
exports.createNote = async (req, res) => {
  try {
    const note = new CreditDebitNote(req.body);
    await note.save();
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getNotes = async (req, res) => {
  try {
    const { shopId, invoiceId } = req.query;
    const filter = {};
    if (shopId) filter.shopId = shopId;
    if (invoiceId) filter.invoiceId = invoiceId;
    
    const notes = await CreditDebitNote.find(filter).populate('invoiceId').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
