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
    const { status, supplierId, startDate, endDate, search, page = 1, limit = 50 } = req.query;
    const andClauses = [{ businessId: req.businessId }];
    if (status) andClauses.push({ status });
    if (supplierId) andClauses.push({ supplierId });

    if (startDate || endDate) {
      const dateClause = {};
      if (startDate) dateClause.$gte = new Date(startDate);
      if (endDate) {
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        dateClause.$lte = endD;
      }
      andClauses.push({ date: dateClause });
    }

    if (search) {
      andClauses.push({
        $or: [
          { poNo: { $regex: search, $options: 'i' } },
          { supplierNameSnapshot: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const query = andClauses.length > 1 ? { $and: andClauses } : andClauses[0];

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
    const { supplierId, warehouseId, items, isTaxInclusive, isWithoutGst, currency, currencySymbol, expectedDeliveryDate, terms, notes } = req.body;
    const supplier = await Supplier.findOne({ _id: supplierId, businessId: req.businessId });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

    const supplierStateCode = supplier.address?.stateCode || '27';
    const placeOfSupplyStateCode = req.business.stateCode || '27';

    const withoutGstFlag = Boolean(isWithoutGst);
    const docCurrency = currency || req.business.currency || 'INR';
    const docCurrencySymbol = currencySymbol || (docCurrency === 'USD' ? '$' : '₹');

    const taxCalc = TaxDeterminationService.calculateItemTaxes(items, supplierStateCode, placeOfSupplyStateCode, isTaxInclusive, withoutGstFlag);
    const poNo = await SequenceService.getNextDocumentNumber(req.businessId, 'purchase_order', req.financialYear);

    const processedExtraCharges = (req.body.extraCharges || []).filter(c => c && c.name && String(c.name).trim() !== '').map(ch => {
      const rate = Number(ch.rate) || 0;
      let amount = 0;
      if (ch.type === 'percentage') {
        amount = (taxCalc.subtotal * rate) / 100;
      } else {
        amount = rate;
      }
      const isDeduction = ch.isDeduction !== undefined
        ? Boolean(ch.isDeduction)
        : /tds|discount|less|deduct/i.test(ch.name);

      return {
        name: String(ch.name).trim(),
        rate,
        type: ch.type === 'percentage' ? 'percentage' : 'amount',
        amount: Number(amount.toFixed(2)),
        isDeduction
      };
    });

    const totalExtraAdditions = processedExtraCharges
      .filter(c => !c.isDeduction)
      .reduce((sum, c) => sum + c.amount, 0);

    const totalExtraDeductions = processedExtraCharges
      .filter(c => c.isDeduction)
      .reduce((sum, c) => sum + c.amount, 0);

    const finalGrandTotal = Math.max(0, taxCalc.grandTotal + totalExtraAdditions - totalExtraDeductions);

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
      isWithoutGst: withoutGstFlag,
      currency: docCurrency,
      currencySymbol: docCurrencySymbol,
      items: taxCalc.items,
      extraCharges: processedExtraCharges,
      subtotal: taxCalc.subtotal,
      totalDiscount: taxCalc.totalDiscount,
      taxableAmount: taxCalc.taxableAmount,
      cgstTotal: taxCalc.cgstTotal,
      sgstTotal: taxCalc.sgstTotal,
      igstTotal: taxCalc.igstTotal,
      totalTax: taxCalc.totalTax,
      roundOff: taxCalc.roundOff,
      grandTotal: finalGrandTotal,
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

exports.getPurchaseOrderById = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findOne({ _id: req.params.id, businessId: req.businessId })
      .populate('supplierId', 'name phone gstin address currentBalance creditDays');
    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    }
    res.status(200).json({ success: true, data: po });
  } catch (error) {
    next(error);
  }
};

exports.updatePurchaseOrder = async (req, res, next) => {
  try {
    const { supplierId, warehouseId, items, isTaxInclusive, isWithoutGst, currency, currencySymbol, expectedDeliveryDate, terms, notes } = req.body;
    const po = await PurchaseOrder.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    }
    if (['completed', 'cancelled'].includes(po.status)) {
      return res.status(400).json({ success: false, message: `Cannot edit a ${po.status} purchase order` });
    }

    const supplier = await Supplier.findOne({ _id: supplierId || po.supplierId, businessId: req.businessId });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

    const supplierStateCode = supplier.address?.stateCode || '27';
    const placeOfSupplyStateCode = req.business.stateCode || '27';

    const withoutGstFlag = isWithoutGst !== undefined ? Boolean(isWithoutGst) : Boolean(po.isWithoutGst);
    const docCurrency = currency || po.currency || req.business.currency || 'INR';
    const docCurrencySymbol = currencySymbol || (docCurrency === 'USD' ? '$' : '₹');

    const taxCalc = TaxDeterminationService.calculateItemTaxes(items, supplierStateCode, placeOfSupplyStateCode, isTaxInclusive, withoutGstFlag);

    const processedExtraCharges = (req.body.extraCharges || []).filter(c => c && c.name && String(c.name).trim() !== '').map(ch => {
      const rate = Number(ch.rate) || 0;
      let amount = 0;
      if (ch.type === 'percentage') {
        amount = (taxCalc.subtotal * rate) / 100;
      } else {
        amount = rate;
      }
      const isDeduction = ch.isDeduction !== undefined
        ? Boolean(ch.isDeduction)
        : /tds|discount|less|deduct/i.test(ch.name);

      return {
        name: String(ch.name).trim(),
        rate,
        type: ch.type === 'percentage' ? 'percentage' : 'amount',
        amount: Number(amount.toFixed(2)),
        isDeduction
      };
    });

    const totalExtraAdditions = processedExtraCharges
      .filter(c => !c.isDeduction)
      .reduce((sum, c) => sum + c.amount, 0);

    const totalExtraDeductions = processedExtraCharges
      .filter(c => c.isDeduction)
      .reduce((sum, c) => sum + c.amount, 0);

    const finalGrandTotal = Math.max(0, taxCalc.grandTotal + totalExtraAdditions - totalExtraDeductions);

    po.supplierId = supplier._id;
    po.supplierNameSnapshot = supplier.name;
    po.supplierGSTINSnapshot = supplier.gstin;
    po.supplierAddressSnapshot = supplier.address;
    po.placeOfSupply = req.business.state;
    po.isInterState = taxCalc.isInterState;
    po.isWithoutGst = withoutGstFlag;
    po.currency = docCurrency;
    po.currencySymbol = docCurrencySymbol;
    if (warehouseId) po.warehouseId = warehouseId;
    if (req.body.date) po.date = req.body.date;
    if (expectedDeliveryDate !== undefined) po.expectedDeliveryDate = expectedDeliveryDate;
    po.items = taxCalc.items;
    po.extraCharges = processedExtraCharges;
    po.subtotal = taxCalc.subtotal;
    po.totalDiscount = taxCalc.totalDiscount;
    po.taxableAmount = taxCalc.taxableAmount;
    po.cgstTotal = taxCalc.cgstTotal;
    po.sgstTotal = taxCalc.sgstTotal;
    po.igstTotal = taxCalc.igstTotal;
    po.totalTax = taxCalc.totalTax;
    po.roundOff = taxCalc.roundOff;
    po.grandTotal = finalGrandTotal;
    if (terms !== undefined) po.terms = terms;
    if (notes !== undefined) po.notes = notes;

    await po.save();

    res.status(200).json({ success: true, message: 'Purchase Order updated successfully', data: po });
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
    const { status, paymentStatus, supplierId, startDate, endDate, search, page = 1, limit = 50 } = req.query;
    const andClauses = [{ businessId: req.businessId }];

    if (status) andClauses.push({ status });
    if (paymentStatus) andClauses.push({ paymentStatus });
    if (supplierId) andClauses.push({ supplierId });

    if (startDate || endDate) {
      const dateClause = {};
      if (startDate) dateClause.$gte = new Date(startDate);
      if (endDate) {
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        dateClause.$lte = endD;
      }
      andClauses.push({ billDate: dateClause });
    }

    if (search) {
      andClauses.push({
        $or: [
          { billNo: { $regex: search, $options: 'i' } },
          { supplierInvoiceNo: { $regex: search, $options: 'i' } },
          { supplierNameSnapshot: { $regex: search, $options: 'i' } },
          { supplierGSTINSnapshot: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const query = andClauses.length > 1 ? { $and: andClauses } : andClauses[0];

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
      isWithoutGst = false,
      currency,
      currencySymbol,
      notes,
      terms,
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

    const withoutGstFlag = Boolean(isWithoutGst);
    const docCurrency = currency || req.business.currency || 'INR';
    const docCurrencySymbol = currencySymbol || (docCurrency === 'USD' ? '$' : '₹');

    const taxCalc = TaxDeterminationService.calculateItemTaxes(items, supplierStateCode, placeOfSupplyStateCode, isTaxInclusive, withoutGstFlag);
    const billNo = await SequenceService.getNextDocumentNumber(req.businessId, 'purchase_bill', req.financialYear);

    const processedExtraCharges = (req.body.extraCharges || []).filter(c => c && c.name && String(c.name).trim() !== '').map(ch => {
      const rate = Number(ch.rate) || 0;
      let amount = 0;
      if (ch.type === 'percentage') {
        amount = (taxCalc.subtotal * rate) / 100;
      } else {
        amount = rate;
      }
      const isDeduction = ch.isDeduction !== undefined
        ? Boolean(ch.isDeduction)
        : /tds|discount|less|deduct/i.test(ch.name);

      return {
        name: String(ch.name).trim(),
        rate,
        type: ch.type === 'percentage' ? 'percentage' : 'amount',
        amount: Number(amount.toFixed(2)),
        isDeduction
      };
    });

    const totalExtraAdditions = processedExtraCharges
      .filter(c => !c.isDeduction)
      .reduce((sum, c) => sum + c.amount, 0);

    const totalExtraDeductions = processedExtraCharges
      .filter(c => c.isDeduction)
      .reduce((sum, c) => sum + c.amount, 0);

    const finalGrandTotal = Math.max(0, taxCalc.grandTotal + totalExtraAdditions - totalExtraDeductions);

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
      isWithoutGst: withoutGstFlag,
      currency: docCurrency,
      currencySymbol: docCurrencySymbol,
      terms,
      items: taxCalc.items,
      extraCharges: processedExtraCharges,
      subtotal: taxCalc.subtotal,
      totalDiscount: taxCalc.totalDiscount,
      taxableAmount: taxCalc.taxableAmount,
      cgstTotal: taxCalc.cgstTotal,
      sgstTotal: taxCalc.sgstTotal,
      igstTotal: taxCalc.igstTotal,
      cessTotal: taxCalc.cessTotal,
      totalTax: taxCalc.totalTax,
      roundOff: taxCalc.roundOff,
      grandTotal: finalGrandTotal,
      paidAmount: 0,
      balanceAmount: finalGrandTotal,
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
