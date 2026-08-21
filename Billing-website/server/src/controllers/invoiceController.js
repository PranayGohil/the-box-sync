const {
  Invoice,
  Customer,
  Warehouse,
  Payment,
  PaymentAllocation,
  Product
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
    const { status, paymentStatus, customerId, startDate, endDate, search, page = 1, limit = 50 } = req.query;
    const query = { businessId: req.businessId };

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (customerId) query.customerId = customerId;

    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { invoiceNo: { $regex: search, $options: 'i' } },
        { customerNameSnapshot: { $regex: search, $options: 'i' } },
        { customerGSTINSnapshot: { $regex: search, $options: 'i' } }
      ];
    }

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

    // 1. Calculate Tax Breakdown (CGST+SGST vs IGST)
    const taxCalc = TaxDeterminationService.calculateItemTaxes(
      items,
      supplierStateCode,
      placeOfSupplyStateCode,
      isTaxInclusive
    );

    // 2. Generate Safe Sequential Invoice Number
    const invoiceNo = await SequenceService.getNextDocumentNumber(
      req.businessId,
      'invoice',
      req.financialYear,
      req.body.branchId || null
    );

    const initialPaid = Math.min(taxCalc.grandTotal, Number(paidAmount) || 0);
    const balance = taxCalc.grandTotal - initialPaid;
    const paymentStatus = initialPaid >= taxCalc.grandTotal ? 'paid' : initialPaid > 0 ? 'partially_paid' : 'unpaid';

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
      shippingAddressSnapshot: customer.shippingAddress || customer.billingAddress,
      placeOfSupply: customer.billingAddress?.state || req.business.state,
      placeOfSupplyStateCode,
      isInterState: taxCalc.isInterState,
      reverseCharge: false,
      sourceDocumentType,
      sourceDocumentId,
      salespersonId,
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
