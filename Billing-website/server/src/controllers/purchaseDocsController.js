const {
  PurchaseOrder,
  GoodsReceipt,
  PurchaseBill,
  PurchaseReturn,
  DebitNote,
  Supplier,
  Warehouse
} = require('../models');
const TaxDeterminationService = require('../services/TaxDeterminationService');
const SequenceService = require('../services/SequenceService');
const StockService = require('../services/StockService');
const AccountingService = require('../services/AccountingService');
const ReversalService = require('../services/ReversalService');
const DocConversionService = require('../services/DocConversionService');

// --- PURCHASE ORDERS ---

exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const { status, supplierId, page = 1, limit = 50 } = req.query;
    const query = { businessId: req.businessId };
    if (status) query.status = status;
    if (supplierId) query.supplierId = supplierId;

    const total = await PurchaseOrder.countDocuments(query);
    const pos = await PurchaseOrder.find(query)
      .populate('supplierId', 'name phone gstin companyName')
      .populate('warehouseId', 'name code')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: pos,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

exports.createPurchaseOrder = async (req, res, next) => {
  try {
    const { supplierId, warehouseId, items, isTaxInclusive, expectedDeliveryDate, terms, notes } = req.body;
    const supplier = await Supplier.findOne({ _id: supplierId, businessId: req.businessId });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

    const supplierStateCode = supplier.address?.stateCode || '27';
    const placeOfSupplyStateCode = req.business.stateCode || '27';

    const taxCalc = TaxDeterminationService.calculateItemTaxes(items, supplierStateCode, placeOfSupplyStateCode, isTaxInclusive);
    const poNo = await SequenceService.getNextDocumentNumber(req.businessId, 'purchase_order', req.financialYear);

    const po = await PurchaseOrder.create({
      businessId: req.businessId,
      branchId: req.body.branchId || null,
      warehouseId,
      poNo,
      date: req.body.date || new Date(),
      expectedDeliveryDate,
      supplierId: supplier._id,
      supplierNameSnapshot: supplier.name,
      supplierGSTINSnapshot: supplier.gstin,
      supplierAddressSnapshot: supplier.address,
      placeOfSupply: req.business.state,
      isInterState: taxCalc.isInterState,
      items: taxCalc.items,
      subtotal: taxCalc.subtotal,
      totalDiscount: taxCalc.totalDiscount,
      taxableAmount: taxCalc.taxableAmount,
      cgstTotal: taxCalc.cgstTotal,
      sgstTotal: taxCalc.sgstTotal,
      igstTotal: taxCalc.igstTotal,
      totalTax: taxCalc.totalTax,
      roundOff: taxCalc.roundOff,
      grandTotal: taxCalc.grandTotal,
      terms,
      notes,
      status: 'approved',
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, message: 'Purchase Order created', data: po });
  } catch (error) {
    next(error);
  }
};

exports.convertPOToGRN = async (req, res, next) => {
  try {
    const { warehouseId, deliveryChallanNo, vehicleNo, items } = req.body;
    const grn = await DocConversionService.convertPOToGRN(
      req.businessId,
      req.params.id,
      warehouseId,
      deliveryChallanNo,
      vehicleNo,
      items,
      req.user._id
    );
    res.status(201).json({ success: true, message: 'GRN created and stock added to warehouse', data: grn });
  } catch (error) {
    next(error);
  }
};

// --- GOODS RECEIPT (GRN) ---

exports.getGoodsReceipts = async (req, res, next) => {
  try {
    const grns = await GoodsReceipt.find({ businessId: req.businessId })
      .populate('supplierId', 'name phone')
      .populate('warehouseId', 'name code')
      .populate('purchaseOrderId', 'poNo')
      .sort({ date: -1 });

    res.status(200).json({ success: true, data: grns });
  } catch (error) {
    next(error);
  }
};

// --- PURCHASE BILLS ---

exports.getPurchaseBills = async (req, res, next) => {
  try {
    const { status, paymentStatus, supplierId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = { businessId: req.businessId };

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (supplierId) query.supplierId = supplierId;

    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }

    const total = await PurchaseBill.countDocuments(query);
    const bills = await PurchaseBill.find(query)
      .populate('supplierId', 'name phone gstin companyName')
      .populate('warehouseId', 'name code')
      .sort({ billDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: bills,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

exports.createPurchaseBill = async (req, res, next) => {
  try {
    const {
      supplierId,
      warehouseId,
      supplierInvoiceNo,
      billDate,
      dueDate,
      items,
      isTaxInclusive = false,
      notes,
      skipStockAddition = false
    } = req.body;

    if (!supplierId || !supplierInvoiceNo || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Supplier, supplier invoice no and items are required' });
    }

    const supplier = await Supplier.findOne({ _id: supplierId, businessId: req.businessId });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

    let targetWarehouseId = warehouseId;
    if (!targetWarehouseId) {
      const defaultWh = await Warehouse.findOne({ businessId: req.businessId, isDefault: true });
      targetWarehouseId = defaultWh?._id;
    }

    const supplierStateCode = supplier.address?.stateCode || '27';
    const placeOfSupplyStateCode = req.business.stateCode || '27';

    const taxCalc = TaxDeterminationService.calculateItemTaxes(items, supplierStateCode, placeOfSupplyStateCode, isTaxInclusive);
    const billNo = await SequenceService.getNextDocumentNumber(req.businessId, 'purchase_bill', req.financialYear);

    const purchaseBill = await PurchaseBill.create({
      businessId: req.businessId,
      branchId: req.body.branchId || null,
      warehouseId: targetWarehouseId,
      financialYear: req.financialYear,
      billNo,
      supplierInvoiceNo,
      billDate: billDate || new Date(),
      dueDate: dueDate || new Date(Date.now() + (supplier.creditDays || 30) * 24 * 60 * 60 * 1000),
      supplierId: supplier._id,
      supplierNameSnapshot: supplier.name,
      supplierGSTINSnapshot: supplier.gstin || '',
      supplierPANSnapshot: supplier.pan || '',
      supplierAddressSnapshot: supplier.address,
      placeOfSupply: req.business.state,
      placeOfSupplyStateCode,
      isInterState: taxCalc.isInterState,
      items: taxCalc.items,
      subtotal: taxCalc.subtotal,
      totalDiscount: taxCalc.totalDiscount,
      taxableAmount: taxCalc.taxableAmount,
      cgstTotal: taxCalc.cgstTotal,
      sgstTotal: taxCalc.sgstTotal,
      igstTotal: taxCalc.igstTotal,
      cessTotal: taxCalc.cessTotal,
      totalTax: taxCalc.totalTax,
      roundOff: taxCalc.roundOff,
      grandTotal: taxCalc.grandTotal,
      paidAmount: 0,
      balanceAmount: taxCalc.grandTotal,
      paymentStatus: 'unpaid',
      notes,
      status: 'finalized',
      createdBy: req.user._id
    });

    // 1. Add Stock into warehouse unless already received via GRN
    if (!skipStockAddition && targetWarehouseId) {
      await StockService.addStock({
        businessId: req.businessId,
        branchId: req.body.branchId || null,
        warehouseId: targetWarehouseId,
        items: taxCalc.items,
        voucherType: 'purchase_bill',
        voucherNo: billNo,
        referenceId: purchaseBill._id,
        userId: req.user._id
      });
    }

    // 2. Post Double-Entry Journal Entry
    const journalEntry = await AccountingService.postPurchaseBill(purchaseBill, req.user._id);
    purchaseBill.journalEntryId = journalEntry._id;
    await purchaseBill.save();

    res.status(201).json({
      success: true,
      message: `Purchase Bill #${billNo} finalized & stock updated`,
      data: purchaseBill
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelPurchaseBill = async (req, res, next) => {
  try {
    const { reason = 'Cancelled by user' } = req.body;
    const cancelled = await ReversalService.cancelPurchaseBill(req.businessId, req.params.id, reason, req.user._id);
    res.status(200).json({ success: true, message: 'Purchase bill cancelled and reversed', data: cancelled });
  } catch (error) {
    next(error);
  }
};

// --- PURCHASE RETURNS & DEBIT NOTES ---

exports.getPurchaseReturns = async (req, res, next) => {
  try {
    const returns = await PurchaseReturn.find({ businessId: req.businessId })
      .populate('supplierId', 'name phone')
      .populate('purchaseBillId', 'billNo supplierInvoiceNo')
      .sort({ date: -1 });

    res.status(200).json({ success: true, data: returns });
  } catch (error) {
    next(error);
  }
};

exports.createPurchaseReturn = async (req, res, next) => {
  try {
    const { purchaseBillId, items, reason = 'purchase_return', notes, warehouseId } = req.body;
    const bill = await PurchaseBill.findOne({ _id: purchaseBillId, businessId: req.businessId });
    if (!bill) return res.status(404).json({ success: false, message: 'Purchase bill not found' });

    const supplierStateCode = bill.placeOfSupplyStateCode || '27';
    const placeOfSupplyStateCode = req.business.stateCode || '27';

    const taxCalc = TaxDeterminationService.calculateItemTaxes(items, supplierStateCode, placeOfSupplyStateCode);
    const returnNo = await SequenceService.getNextDocumentNumber(req.businessId, 'purchase_return', req.financialYear);
    const debitNoteNo = await SequenceService.getNextDocumentNumber(req.businessId, 'debit_note', req.financialYear);

    const targetWarehouseId = warehouseId || bill.warehouseId;

    // 1. Create Purchase Return record
    const purchaseReturn = await PurchaseReturn.create({
      businessId: req.businessId,
      warehouseId: targetWarehouseId,
      returnNo,
      date: new Date(),
      purchaseBillId: bill._id,
      supplierId: bill.supplierId,
      supplierNameSnapshot: bill.supplierNameSnapshot,
      items: taxCalc.items,
      taxableAmount: taxCalc.taxableAmount,
      totalTax: taxCalc.totalTax,
      grandTotal: taxCalc.grandTotal,
      reason,
      stockDeducted: true,
      notes,
      status: 'processed',
      createdBy: req.user._id
    });

    // 2. Deduct Stock back OUT of Warehouse
    if (targetWarehouseId) {
      await StockService.deductStock({
        businessId: req.businessId,
        branchId: bill.branchId,
        warehouseId: targetWarehouseId,
        items: taxCalc.items,
        voucherType: 'purchase_return',
        voucherNo: returnNo,
        referenceId: purchaseReturn._id,
        userId: req.user._id
      });
    }

    // 3. Create Linked Debit Note
    const debitNote = await DebitNote.create({
      businessId: req.businessId,
      branchId: bill.branchId,
      debitNoteNo,
      date: new Date(),
      originalPurchaseBillId: bill._id,
      originalPurchaseBillNo: bill.billNo,
      purchaseReturnId: purchaseReturn._id,
      supplierId: bill.supplierId,
      supplierNameSnapshot: bill.supplierNameSnapshot,
      supplierGSTINSnapshot: bill.supplierGSTINSnapshot,
      placeOfSupply: req.business.state,
      isInterState: taxCalc.isInterState,
      items: taxCalc.items,
      taxableAmount: taxCalc.taxableAmount,
      cgstTotal: taxCalc.cgstTotal,
      sgstTotal: taxCalc.sgstTotal,
      igstTotal: taxCalc.igstTotal,
      totalTax: taxCalc.totalTax,
      roundOff: taxCalc.roundOff,
      grandTotal: taxCalc.grandTotal,
      reason: 'purchase_return',
      notes,
      status: 'finalized',
      createdBy: req.user._id
    });

    purchaseReturn.debitNoteId = debitNote._id;
    await purchaseReturn.save();

    // 4. Post Debit Note into Double-Entry Ledgers (Debits Supplier, Credits Purchase Return & Input GST)
    const creditorsAcc = await AccountingService.getAccountByType(req.businessId, 'supplier');
    const purchaseReturnAcc = await AccountingService.getAccountByType(req.businessId, 'purchase_return');
    const cgstInputAcc = await AccountingService.getAccountByType(req.businessId, 'gst_cgst_input');
    const sgstInputAcc = await AccountingService.getAccountByType(req.businessId, 'gst_sgst_input');
    const igstInputAcc = await AccountingService.getAccountByType(req.businessId, 'gst_igst_input');

    const lines = [
      {
        accountId: creditorsAcc._id,
        partyType: 'supplier',
        partyId: bill.supplierId,
        debit: taxCalc.grandTotal,
        credit: 0,
        narration: `Debit Note #${debitNoteNo} on Bill #${bill.billNo}`
      },
      {
        accountId: purchaseReturnAcc._id,
        debit: 0,
        credit: taxCalc.taxableAmount,
        narration: `Purchase Return from Bill #${bill.billNo}`
      }
    ];

    if (taxCalc.cgstTotal > 0 && cgstInputAcc) {
      lines.push({ accountId: cgstInputAcc._id, debit: 0, credit: taxCalc.cgstTotal, narration: 'Input CGST Reversal' });
    }
    if (taxCalc.sgstTotal > 0 && sgstInputAcc) {
      lines.push({ accountId: sgstInputAcc._id, debit: 0, credit: taxCalc.sgstTotal, narration: 'Input SGST Reversal' });
    }
    if (taxCalc.igstTotal > 0 && igstInputAcc) {
      lines.push({ accountId: igstInputAcc._id, debit: 0, credit: taxCalc.igstTotal, narration: 'Input IGST Reversal' });
    }

    const journalEntry = await AccountingService.postJournalEntry({
      businessId: req.businessId,
      branchId: bill.branchId,
      financialYear: req.financialYear,
      voucherType: 'debit_note',
      voucherNo: debitNoteNo,
      referenceId: debitNote._id,
      referenceModel: 'DebitNote',
      narration: `Debit Note #${debitNoteNo} against Bill #${bill.billNo}`,
      lines,
      userId: req.user._id
    });

    debitNote.journalEntryId = journalEntry._id;
    await debitNote.save();

    res.status(201).json({
      success: true,
      message: `Purchase Return recorded and Debit Note #${debitNoteNo} generated`,
      data: { purchaseReturn, debitNote }
    });
  } catch (error) {
    next(error);
  }
};

exports.getDebitNotes = async (req, res, next) => {
  try {
    const notes = await DebitNote.find({ businessId: req.businessId })
      .populate('supplierId', 'name phone')
      .populate('originalPurchaseBillId', 'billNo supplierInvoiceNo')
      .sort({ date: -1 });

    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
};
