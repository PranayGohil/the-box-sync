const {
  Invoice,
  Customer,
  Warehouse,
  Payment,
  PaymentAllocation,
  Product,
  SalesOrder
} = require('../models');
const TaxDeterminationService = require('../services/TaxDeterminationService');
const SequenceService = require('../services/SequenceService');
const StockService = require('../services/StockService');
const AccountingService = require('../services/AccountingService');
const ReversalService = require('../services/ReversalService');
const ProviderService = require('../services/ProviderService');

// @desc    Get all Invoices with status, date, customer filters & pagination
// @route   GET /api/invoices
exports.getInvoices = async (req, res, next) => {
  try {
    const {
      status,
      paymentStatus,
      customerId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
      category,
      invoiceCategory
    } = req.query;

    const andClauses = [{ businessId: req.businessId }];

    if (status) andClauses.push({ status });
    if (paymentStatus) andClauses.push({ paymentStatus });
    if (customerId) andClauses.push({ customerId });

    if (startDate || endDate) {
      const dateClause = {};
      if (startDate) dateClause.$gte = new Date(startDate);
      if (endDate) {
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        dateClause.$lte = endD;
      }
      andClauses.push({ invoiceDate: dateClause });
    }

    if (search) {
      andClauses.push({
        $or: [
          { invoiceNo: { $regex: search, $options: 'i' } },
          { customerNameSnapshot: { $regex: search, $options: 'i' } },
          { customerGSTINSnapshot: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const cat = category || invoiceCategory;
    if (cat) {
      if (cat === 'B2B') {
        andClauses.push({
          $or: [
            { invoiceCategory: 'B2B' },
            { customerGSTINSnapshot: { $exists: true, $regex: /\S+/ } }
          ]
        });
      } else if (cat === 'B2C') {
        andClauses.push({
          $or: [
            { invoiceCategory: 'B2C' },
            {
              $and: [
                { invoiceCategory: { $nin: ['B2B', 'SEZ', 'DEEMED'] } },
                {
                  $or: [
                    { customerGSTINSnapshot: { $exists: false } },
                    { customerGSTINSnapshot: '' },
                    { customerGSTINSnapshot: null }
                  ]
                }
              ]
            }
          ]
        });
      } else {
        andClauses.push({ invoiceCategory: cat });
      }
    }

    const query = andClauses.length > 1 ? { $and: andClauses } : andClauses[0];

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('customerId', 'name phone gstin email')
      .populate('warehouseId', 'name code')
      .sort({ invoiceDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single Invoice by ID with detailed lines & UPI QR
// @route   GET /api/invoices/:id
exports.getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, businessId: req.businessId })
      .populate('customerId')
      .populate('warehouseId')
      .populate('branchId')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Generate Live UPI QR Code if business has upiId
    let upiQRCode = null;
    if (req.business.upiId && invoice.balanceAmount > 0) {
      const upiData = await ProviderService.generateUPIQRCode({
        upiId: req.business.upiId,
        payeeName: req.business.name,
        amount: invoice.balanceAmount,
        invoiceNo: invoice.invoiceNo,
        businessName: req.business.name
      });
      upiQRCode = upiData?.qrDataUrl;
    }

    res.status(200).json({
      success: true,
      data: {
        invoice,
        business: req.business,
        upiQRCode
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create and Finalize a GST Sales Tax Invoice
// @route   POST /api/invoices
exports.createInvoice = async (req, res, next) => {
  try {
    const {
      customerId,
      warehouseId,
      items,
      isTaxInclusive = false,
      isWithoutGst = false,
      currency,
      currencySymbol,
      invoiceDate,
      dueDate,
      invoiceType = 'tax_invoice',
      sourceDocumentType = 'direct',
      sourceDocumentId = null,
      salespersonId = null,
      paidAmount = 0,
      paymentMode = 'cash',
      printTemplate = 'modern',
      terms,
      notes
    } = req.body;

    if (!customerId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer and invoice line items are required' });
    }

    const customer = await Customer.findOne({ _id: customerId, businessId: req.businessId });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Determine target warehouse
    let targetWarehouseId = warehouseId;
    if (!targetWarehouseId) {
      const defaultWh = await Warehouse.findOne({ businessId: req.businessId, isDefault: true });
      targetWarehouseId = defaultWh?._id;
    }
    if (!targetWarehouseId) {
      const anyWh = await Warehouse.findOne({ businessId: req.businessId });
      targetWarehouseId = anyWh?._id;
    }

    const supplierStateCode = req.business.stateCode || '27';
    const placeOfSupplyStateCode = customer.billingAddress?.stateCode || supplierStateCode;

    const docCurrency = currency || req.business.currency || 'INR';
    const docCurrencySymbol = currencySymbol || (docCurrency === 'USD' ? '$' : '₹');
    const withoutGstFlag = Boolean(isWithoutGst);

    // 1. Calculate Tax Breakdown (CGST+SGST vs IGST)
    const taxCalc = TaxDeterminationService.calculateItemTaxes(
      items,
      supplierStateCode,
      placeOfSupplyStateCode,
      isTaxInclusive,
      withoutGstFlag
    );

    // 1.1 Process Extra Charges / Custom Fields (e.g. TDS, Courier charges, Freight, etc.)
    let totalExtraAdditions = 0;
    let totalExtraDeductions = 0;
    const processedExtraCharges = (req.body.extraCharges || []).filter(c => c && c.name && String(c.name).trim() !== '').map(ch => {
      const rate = Number(ch.rate) || 0;
      const type = ch.type === 'percentage' ? 'percentage' : 'amount';
      let computed = 0;
      if (type === 'percentage') {
        computed = (taxCalc.taxableAmount * rate) / 100;
      } else {
        computed = rate;
      }
      const isDeduction = ch.isDeduction !== undefined
        ? Boolean(ch.isDeduction)
        : /tds|discount|less|deduct/i.test(ch.name || '');

      const roundedAmount = Number(computed.toFixed(2));
      if (isDeduction) {
        totalExtraDeductions += roundedAmount;
      } else {
        totalExtraAdditions += roundedAmount;
      }

      return {
        name: String(ch.name).trim(),
        rate,
        type,
        amount: roundedAmount,
        isDeduction
      };
    });

    const adjustedRawGrandTotal = taxCalc.taxableAmount + taxCalc.totalTax + totalExtraAdditions - totalExtraDeductions;
    const finalGrandTotal = Math.max(0, Math.round(adjustedRawGrandTotal));
    const finalRoundOff = Number((finalGrandTotal - adjustedRawGrandTotal).toFixed(2));

    // 2. Generate Safe Sequential Invoice Number
    const invoiceNo = await SequenceService.getNextDocumentNumber(
      req.businessId,
      'invoice',
      req.financialYear,
      req.body.branchId || null
    );

    const initialPaid = Math.min(finalGrandTotal, Number(paidAmount) || 0);
    const balance = finalGrandTotal - initialPaid;
    const paymentStatus = initialPaid >= finalGrandTotal ? 'paid' : initialPaid > 0 ? 'partially_paid' : 'unpaid';

    // 3. Create Finalized Invoice
    const invoice = await Invoice.create({
      businessId: req.businessId,
      branchId: req.body.branchId || null,
      warehouseId: targetWarehouseId,
      financialYear: req.financialYear,
      invoiceNo,
      invoiceDate: invoiceDate || new Date(),
      dueDate: dueDate || new Date(Date.now() + (customer.creditDays || 30) * 24 * 60 * 60 * 1000),
      invoiceType,
      invoiceCategory: customer.customerType === 'B2B' ? 'B2B' : 'B2C',
      customerId: customer._id,
      customerNameSnapshot: customer.name,
      customerGSTINSnapshot: customer.gstin || '',
      customerPANSnapshot: customer.pan || '',
      sellerGSTINSnapshot: req.business.gstin || '',
      billingAddressSnapshot: customer.billingAddress,
      shippingAddressSnapshot: req.body.shippingAddress || customer.shippingAddress || customer.billingAddress,
      placeOfSupply: customer.billingAddress?.state || req.business.state,
      placeOfSupplyStateCode,
      isInterState: taxCalc.isInterState,
      isWithoutGst: withoutGstFlag,
      currency: docCurrency,
      currencySymbol: docCurrencySymbol,
      reverseCharge: false,
      sourceDocumentType,
      sourceDocumentId,
      salespersonId,
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
      roundOff: finalRoundOff,
      grandTotal: finalGrandTotal,
      paidAmount: initialPaid,
      balanceAmount: balance,
      paymentStatus,
      printTemplate: printTemplate || req.business.settings?.invoiceTemplate || 'modern',
      terms: terms || req.business.settings?.termsAndConditions,
      notes,
      status: 'finalized',
      createdBy: req.user._id
    });

    // 4. Deduct Physical Stock from Inventory
    if (targetWarehouseId) {
      await StockService.deductStock({
        businessId: req.businessId,
        branchId: req.body.branchId || null,
        warehouseId: targetWarehouseId,
        items: taxCalc.items,
        voucherType: 'invoice',
        voucherNo: invoiceNo,
        referenceId: invoice._id,
        userId: req.user._id
      });
    }

    // 5. Post Double-Entry Journal Entry
    const journalEntry = await AccountingService.postSalesInvoice(invoice, req.user._id);
    invoice.journalEntryId = journalEntry._id;
    await invoice.save();

    // 6. Handle immediate payment if specified (e.g. POS or Cash sale)
    if (initialPaid > 0) {
      const paymentNo = await SequenceService.getNextDocumentNumber(req.businessId, 'payment_in', req.financialYear);
      const payment = await Payment.create({
        businessId: req.businessId,
        branchId: req.body.branchId || null,
        paymentNo,
        paymentType: 'in',
        partyType: 'customer',
        partyId: customer._id,
        partyNameSnapshot: customer.name,
        date: new Date(),
        amount: initialPaid,
        unallocatedAmount: 0,
        paymentMode: paymentMode || 'cash',
        notes: `Immediate payment for Invoice #${invoiceNo}`,
        status: 'completed',
        createdBy: req.user._id
      });

      await PaymentAllocation.create({
        businessId: req.businessId,
        paymentId: payment._id,
        documentType: 'invoice',
        documentId: invoice._id,
        documentNo: invoiceNo,
        allocatedAmount: initialPaid
      });

      await AccountingService.postPayment(payment, req.user._id);
    }

    // 7. If converted from Sales Order, mark sales order as completed & release reservation
    if (sourceDocumentType === 'sales_order' && sourceDocumentId) {
      await SalesOrder.findOneAndUpdate(
        { _id: sourceDocumentId, businessId: req.businessId },
        { status: 'completed' }
      );
      await StockService.releaseStockReservation(req.businessId, sourceDocumentId);
    }

    res.status(201).json({
      success: true,
      message: `Invoice #${invoiceNo} created & finalized successfully`,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Fast POS Checkout endpoint (Instant split payment, barcode, one-click invoice)
// @route   POST /api/invoices/pos-checkout
exports.posCheckout = async (req, res, next) => {
  try {
    const { customerId, items, paymentMode = 'cash', paidAmount, customerName = 'Walk-in Customer', customerPhone = '' } = req.body;

    let customer;
    if (customerId) {
      customer = await Customer.findOne({ _id: customerId, businessId: req.businessId });
    }

    if (!customer) {
      // Find or create default walk-in cash customer
      customer = await Customer.findOne({ businessId: req.businessId, name: 'Walk-in Customer' });
      if (!customer) {
        customer = await Customer.create({
          businessId: req.businessId,
          name: customerName || 'Walk-in Customer',
          phone: customerPhone || '',
          customerType: 'B2C',
          billingAddress: {
            street: 'Counter Sale',
            city: req.business.city || 'Pune',
            state: req.business.state || 'Maharashtra',
            stateCode: req.business.stateCode || '27'
          }
        });
      }
    }

    // Call standard createInvoice with POS parameters
    req.body.customerId = customer._id;
    req.body.sourceDocumentType = 'pos';
    req.body.printTemplate = 'thermal';
    req.body.paidAmount = paidAmount !== undefined ? paidAmount : 0;
    req.body.paymentMode = paymentMode;

    return exports.createInvoice(req, res, next);
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel Invoice with full stock & accounting reversal
// @route   POST /api/invoices/:id/cancel
exports.cancelInvoice = async (req, res, next) => {
  try {
    const { reason = 'Cancelled by user' } = req.body;
    const cancelledInvoice = await ReversalService.cancelInvoice(
      req.businessId,
      req.params.id,
      reason,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: `Invoice #${cancelledInvoice.invoiceNo} cancelled and reversed successfully`,
      data: cancelledInvoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing GST Invoice
// @route   PUT /api/invoices/:id
exports.updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    if (invoice.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cancelled invoices cannot be edited' });
    }

    const {
      customerId,
      items,
      isTaxInclusive,
      isWithoutGst,
      currency,
      currencySymbol,
      invoiceDate,
      dueDate,
      paidAmount,
      paymentMode,
      printTemplate,
      terms,
      notes,
      shippingAddress
    } = req.body;

    const customer = await Customer.findOne({ _id: customerId || invoice.customerId, businessId: req.businessId });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const supplierStateCode = req.business.stateCode || '27';
    const placeOfSupplyStateCode = customer.billingAddress?.stateCode || supplierStateCode;

    const withoutGstFlag = isWithoutGst !== undefined ? Boolean(isWithoutGst) : Boolean(invoice.isWithoutGst);
    const docCurrency = currency || invoice.currency || req.business.currency || 'INR';
    const docCurrencySymbol = currencySymbol || (docCurrency === 'USD' ? '$' : '₹');

    // Calculate Tax Breakdown
    const taxCalc = TaxDeterminationService.calculateItemTaxes(
      items || invoice.items,
      supplierStateCode,
      placeOfSupplyStateCode,
      isTaxInclusive !== undefined ? isTaxInclusive : invoice.isTaxInclusive,
      withoutGstFlag
    );

    let totalExtraAdditions = 0;
    let totalExtraDeductions = 0;
    const rawExtraCharges = req.body.extraCharges !== undefined ? req.body.extraCharges : invoice.extraCharges;
    const processedExtraCharges = (rawExtraCharges || []).filter(c => c && c.name && String(c.name).trim() !== '').map(ch => {
      const rate = Number(ch.rate) || 0;
      const type = ch.type === 'percentage' ? 'percentage' : 'amount';
      let computed = 0;
      if (type === 'percentage') {
        computed = (taxCalc.taxableAmount * rate) / 100;
      } else {
        computed = rate;
      }
      const isDeduction = ch.isDeduction !== undefined
        ? Boolean(ch.isDeduction)
        : /tds|discount|less|deduct/i.test(ch.name || '');

      const roundedAmount = Number(computed.toFixed(2));
      if (isDeduction) {
        totalExtraDeductions += roundedAmount;
      } else {
        totalExtraAdditions += roundedAmount;
      }

      return {
        name: String(ch.name).trim(),
        rate,
        type,
        amount: roundedAmount,
        isDeduction
      };
    });

    const adjustedRawGrandTotal = taxCalc.taxableAmount + taxCalc.totalTax + totalExtraAdditions - totalExtraDeductions;
    const finalGrandTotal = Math.max(0, Math.round(adjustedRawGrandTotal));
    const finalRoundOff = Number((finalGrandTotal - adjustedRawGrandTotal).toFixed(2));

    const newPaid = paidAmount !== undefined ? Number(paidAmount) : invoice.paidAmount;
    const finalPaid = Math.min(finalGrandTotal, Math.max(0, newPaid));
    const balance = finalGrandTotal - finalPaid;
    const paymentStatus = finalPaid >= finalGrandTotal ? 'paid' : finalPaid > 0 ? 'partially_paid' : 'unpaid';

    invoice.customerId = customer._id;
    invoice.customerNameSnapshot = customer.name;
    invoice.customerGSTINSnapshot = customer.gstin || '';
    invoice.customerPANSnapshot = customer.pan || '';
    invoice.billingAddressSnapshot = customer.billingAddress;
    if (shippingAddress) invoice.shippingAddressSnapshot = shippingAddress;
    invoice.invoiceCategory = customer.customerType === 'B2B' ? 'B2B' : 'B2C';
    if (invoiceDate) invoice.invoiceDate = new Date(invoiceDate);
    if (dueDate) invoice.dueDate = new Date(dueDate);
    invoice.isTaxInclusive = Boolean(isTaxInclusive);
    invoice.isWithoutGst = withoutGstFlag;
    invoice.currency = docCurrency;
    invoice.currencySymbol = docCurrencySymbol;
    invoice.items = taxCalc.items;
    invoice.extraCharges = processedExtraCharges;
    invoice.subtotal = taxCalc.subtotal;
    invoice.totalDiscount = taxCalc.totalDiscount;
    invoice.taxableAmount = taxCalc.taxableAmount;
    invoice.cgstTotal = taxCalc.cgstTotal;
    invoice.sgstTotal = taxCalc.sgstTotal;
    invoice.igstTotal = taxCalc.igstTotal;
    invoice.cessTotal = taxCalc.cessTotal;
    invoice.totalTax = taxCalc.totalTax;
    invoice.roundOff = finalRoundOff;
    invoice.grandTotal = finalGrandTotal;
    invoice.paidAmount = finalPaid;
    invoice.balanceAmount = balance;
    invoice.paymentStatus = paymentStatus;
    if (terms !== undefined) invoice.terms = terms;
    if (notes !== undefined) invoice.notes = notes;
    if (printTemplate) invoice.printTemplate = printTemplate;

    await invoice.save();

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};
