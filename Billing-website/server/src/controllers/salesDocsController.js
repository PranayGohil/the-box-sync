const { Quotation, SalesOrder, DeliveryChallan, Customer, Warehouse } = require('../models');
const TaxDeterminationService = require('../services/TaxDeterminationService');
const SequenceService = require('../services/SequenceService');
const StockService = require('../services/StockService');
const DocConversionService = require('../services/DocConversionService');

// --- QUOTATIONS ---

exports.getQuotations = async (req, res, next) => {
  try {
    const { status, customerId, page = 1, limit = 50 } = req.query;
    const query = { businessId: req.businessId };
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;

    const total = await Quotation.countDocuments(query);
    const quotations = await Quotation.find(query)
      .populate('customerId', 'name phone gstin')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: quotations,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

exports.createQuotation = async (req, res, next) => {
  try {
    const { customerId, items, isTaxInclusive, validUntil, terms, notes, salespersonId } = req.body;
    const customer = await Customer.findOne({ _id: customerId, businessId: req.businessId });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const supplierStateCode = req.business.stateCode || '27';
    const placeOfSupplyStateCode = customer.billingAddress?.stateCode || supplierStateCode;

    const taxCalc = TaxDeterminationService.calculateItemTaxes(
      items,
      supplierStateCode,
      placeOfSupplyStateCode,
      isTaxInclusive
    );

    const quotationNo = await SequenceService.getNextDocumentNumber(req.businessId, 'quotation', req.financialYear);

    const quotation = await Quotation.create({
      businessId: req.businessId,
      branchId: req.body.branchId || null,
      quotationNo,
      date: req.body.date || new Date(),
      validUntil: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      customerId: customer._id,
      customerNameSnapshot: customer.name,
      customerGSTINSnapshot: customer.gstin,
      billingAddressSnapshot: customer.billingAddress,
      shippingAddressSnapshot: customer.shippingAddress,
      placeOfSupply: customer.billingAddress?.state || req.business.state,
      isInterState: taxCalc.isInterState,
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
      terms: terms || req.business.settings?.termsAndConditions,
      notes,
      status: 'draft',
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, message: 'Quotation created', data: quotation });
  } catch (error) {
    next(error);
  }
};

exports.convertQuotationToSO = async (req, res, next) => {
  try {
    const salesOrder = await DocConversionService.convertQuotationToSalesOrder(
      req.businessId,
      req.params.id,
      req.financialYear,
      req.user._id
    );
    res.status(200).json({ success: true, message: 'Converted to Sales Order', data: salesOrder });
  } catch (error) {
    next(error);
  }
};

// --- SALES ORDERS ---

exports.getSalesOrders = async (req, res, next) => {
  try {
    const { status, customerId, page = 1, limit = 50 } = req.query;
    const query = { businessId: req.businessId };
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;

    const total = await SalesOrder.countDocuments(query);
    const orders = await SalesOrder.find(query)
      .populate('customerId', 'name phone gstin')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: orders,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

exports.createSalesOrder = async (req, res, next) => {
  try {
    const { customerId, warehouseId, items, isTaxInclusive, deliveryDate, terms, notes, reserveStock = false } = req.body;
    const customer = await Customer.findOne({ _id: customerId, businessId: req.businessId });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const supplierStateCode = req.business.stateCode || '27';
    const placeOfSupplyStateCode = customer.billingAddress?.stateCode || supplierStateCode;

    const taxCalc = TaxDeterminationService.calculateItemTaxes(items, supplierStateCode, placeOfSupplyStateCode, isTaxInclusive);
    const orderNo = await SequenceService.getNextDocumentNumber(req.businessId, 'sales_order', req.financialYear);

    const salesOrder = await SalesOrder.create({
      businessId: req.businessId,
      branchId: req.body.branchId || null,
      warehouseId,
      orderNo,
      date: req.body.date || new Date(),
      deliveryDate,
      customerId: customer._id,
      customerNameSnapshot: customer.name,
      customerGSTINSnapshot: customer.gstin,
      billingAddressSnapshot: customer.billingAddress,
      shippingAddressSnapshot: customer.shippingAddress,
      placeOfSupply: customer.billingAddress?.state || req.business.state,
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
      terms,
      notes,
      isStockReserved: reserveStock,
      status: 'confirmed',
      createdBy: req.user._id
    });

    if (reserveStock && warehouseId) {
      await StockService.reserveStock(req.businessId, salesOrder._id, warehouseId, taxCalc.items);
    }

    res.status(201).json({ success: true, message: 'Sales order created', data: salesOrder });
  } catch (error) {
    next(error);
  }
};

// --- DELIVERY CHALLANS ---

exports.getDeliveryChallans = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = { businessId: req.businessId };
    if (status) query.status = status;

    const total = await DeliveryChallan.countDocuments(query);
    const challans = await DeliveryChallan.find(query)
      .populate('customerId', 'name phone')
      .populate('warehouseId', 'name')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: challans,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

exports.createDeliveryChallan = async (req, res, next) => {
  try {
    const { customerId, warehouseId, items, transporterDetails, stockPolicyApplied = 'DEDUCT', notes } = req.body;
    const customer = await Customer.findOne({ _id: customerId, businessId: req.businessId });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const challanNo = await SequenceService.getNextDocumentNumber(req.businessId, 'delivery_challan', req.financialYear);

    const challan = await DeliveryChallan.create({
      businessId: req.businessId,
      branchId: req.body.branchId || null,
      warehouseId,
      challanNo,
      date: req.body.date || new Date(),
      customerId: customer._id,
      customerNameSnapshot: customer.name,
      customerGSTINSnapshot: customer.gstin,
      deliveryAddressSnapshot: customer.shippingAddress || customer.billingAddress,
      items,
      transporterDetails,
      stockPolicyApplied,
      notes,
      status: 'dispatched',
      createdBy: req.user._id
    });

    // If stock policy is DEDUCT, deduct warehouse stock immediately
    if (stockPolicyApplied === 'DEDUCT' && warehouseId) {
      await StockService.deductStock({
        businessId: req.businessId,
        warehouseId,
        items,
        voucherType: 'delivery_challan',
        voucherNo: challanNo,
        referenceId: challan._id,
        userId: req.user._id
      });
    }

    res.status(201).json({ success: true, message: 'Delivery Challan created', data: challan });
  } catch (error) {
    next(error);
  }
};
