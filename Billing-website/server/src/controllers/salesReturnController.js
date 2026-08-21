const {
  SalesReturn,
  CreditNote,
  Invoice,
  Customer
} = require('../models');
const TaxDeterminationService = require('../services/TaxDeterminationService');
const SequenceService = require('../services/SequenceService');
const StockService = require('../services/StockService');
const AccountingService = require('../services/AccountingService');

// --- SALES RETURNS ---

exports.getSalesReturns = async (req, res, next) => {
  try {
    const returns = await SalesReturn.find({ businessId: req.businessId })
      .populate('customerId', 'name phone')
      .populate('invoiceId', 'invoiceNo')
      .sort({ date: -1 });

    res.status(200).json({ success: true, data: returns });
  } catch (error) {
    next(error);
  }
};

exports.createSalesReturn = async (req, res, next) => {
  try {
    const { invoiceId, items, reason = 'sales_return', notes, warehouseId } = req.body;
    const invoice = await Invoice.findOne({ _id: invoiceId, businessId: req.businessId });
    if (!invoice) return res.status(404).json({ success: false, message: 'Original Invoice not found' });

    const supplierStateCode = req.business.stateCode || '27';
    const placeOfSupplyStateCode = invoice.placeOfSupplyStateCode || supplierStateCode;

    const taxCalc = TaxDeterminationService.calculateItemTaxes(items, supplierStateCode, placeOfSupplyStateCode);
    const returnNo = await SequenceService.getNextDocumentNumber(req.businessId, 'sales_return', req.financialYear);
    const creditNoteNo = await SequenceService.getNextDocumentNumber(req.businessId, 'credit_note', req.financialYear);

    const targetWarehouseId = warehouseId || invoice.warehouseId;

    // 1. Create Sales Return record
    const salesReturn = await SalesReturn.create({
      businessId: req.businessId,
      warehouseId: targetWarehouseId,
      returnNo,
      date: new Date(),
      invoiceId: invoice._id,
      customerId: invoice.customerId,
      customerNameSnapshot: invoice.customerNameSnapshot,
      items: taxCalc.items,
      taxableAmount: taxCalc.taxableAmount,
      totalTax: taxCalc.totalTax,
      grandTotal: taxCalc.grandTotal,
      reason,
      stockRestocked: true,
      notes,
      status: 'processed',
      createdBy: req.user._id
    });

    // 2. Add Returned Stock back into Warehouse (Movement IN)
    if (targetWarehouseId) {
      await StockService.addStock({
        businessId: req.businessId,
        branchId: invoice.branchId,
        warehouseId: targetWarehouseId,
        items: taxCalc.items,
        voucherType: 'sales_return',
        voucherNo: returnNo,
        referenceId: salesReturn._id,
        userId: req.user._id
      });
    }

    // 3. Create Linked Credit Note
    const creditNote = await CreditNote.create({
      businessId: req.businessId,
      branchId: invoice.branchId,
      creditNoteNo,
      date: new Date(),
      originalInvoiceId: invoice._id,
      originalInvoiceNo: invoice.invoiceNo,
      salesReturnId: salesReturn._id,
      customerId: invoice.customerId,
      customerNameSnapshot: invoice.customerNameSnapshot,
      customerGSTINSnapshot: invoice.customerGSTINSnapshot,
      placeOfSupply: invoice.placeOfSupply,
      isInterState: taxCalc.isInterState,
      items: taxCalc.items,
      taxableAmount: taxCalc.taxableAmount,
      cgstTotal: taxCalc.cgstTotal,
      sgstTotal: taxCalc.sgstTotal,
      igstTotal: taxCalc.igstTotal,
      totalTax: taxCalc.totalTax,
      roundOff: taxCalc.roundOff,
      grandTotal: taxCalc.grandTotal,
      reason: 'sales_return',
      notes,
      status: 'finalized',
      createdBy: req.user._id
    });

    salesReturn.creditNoteId = creditNote._id;
    await salesReturn.save();

    // 4. Post Credit Note into Double-Entry Ledgers (Debits Sales/Output Tax, Credits Customer)
    const debtorsAcc = await AccountingService.getAccountByType(req.businessId, 'customer');
    const salesReturnAcc = await AccountingService.getAccountByType(req.businessId, 'sales_return');
    const cgstOutputAcc = await AccountingService.getAccountByType(req.businessId, 'gst_cgst_output');
    const sgstOutputAcc = await AccountingService.getAccountByType(req.businessId, 'gst_sgst_output');
    const igstOutputAcc = await AccountingService.getAccountByType(req.businessId, 'gst_igst_output');

    const lines = [
      {
        accountId: salesReturnAcc._id,
        debit: taxCalc.taxableAmount,
        credit: 0,
        narration: `Sales Return against #${invoice.invoiceNo}`
      }
    ];

    if (taxCalc.cgstTotal > 0 && cgstOutputAcc) {
      lines.push({ accountId: cgstOutputAcc._id, debit: taxCalc.cgstTotal, credit: 0, narration: 'CGST Reversal' });
    }
    if (taxCalc.sgstTotal > 0 && sgstOutputAcc) {
      lines.push({ accountId: sgstOutputAcc._id, debit: taxCalc.sgstTotal, credit: 0, narration: 'SGST Reversal' });
    }
    if (taxCalc.igstTotal > 0 && igstOutputAcc) {
      lines.push({ accountId: igstOutputAcc._id, debit: taxCalc.igstTotal, credit: 0, narration: 'IGST Reversal' });
    }

    lines.push({
      accountId: debtorsAcc._id,
      partyType: 'customer',
      partyId: invoice.customerId,
      debit: 0,
      credit: taxCalc.grandTotal,
      narration: `Credit Note #${creditNoteNo} on #${invoice.invoiceNo}`
    });

    const journalEntry = await AccountingService.postJournalEntry({
      businessId: req.businessId,
      branchId: invoice.branchId,
      financialYear: req.financialYear,
      voucherType: 'credit_note',
      voucherNo: creditNoteNo,
      referenceId: creditNote._id,
      referenceModel: 'CreditNote',
      narration: `Credit Note #${creditNoteNo} against #${invoice.invoiceNo}`,
      lines,
      userId: req.user._id
    });

    creditNote.journalEntryId = journalEntry._id;
    await creditNote.save();

    res.status(201).json({
      success: true,
      message: `Sales Return processed and Credit Note #${creditNoteNo} issued`,
      data: { salesReturn, creditNote }
    });
  } catch (error) {
    next(error);
  }
};

// --- CREDIT NOTES ---

exports.getCreditNotes = async (req, res, next) => {
  try {
    const notes = await CreditNote.find({ businessId: req.businessId })
      .populate('customerId', 'name phone')
      .populate('originalInvoiceId', 'invoiceNo')
      .sort({ date: -1 });

    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
};
