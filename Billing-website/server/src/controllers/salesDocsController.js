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
      shippingAddressSnapshot: req.body.shippingAddress || customer.shippingAddress || customer.billingAddress,
      placeOfSupply: customer.billingAddress?.state || req.business.state,
      isInterState: taxCalc.isInterState,
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
      roundOff: taxCalc.roundOff,
      grandTotal: finalGrandTotal,
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

exports.getQuotationById = async (req, res, next) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, businessId: req.businessId })
      .populate('customerId', 'name phone gstin customerType billingAddress shippingAddress currentBalance creditLimit creditDays');
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }
    res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    next(error);
  }
};

exports.updateQuotation = async (req, res, next) => {
  try {
    const { customerId, items, isTaxInclusive, validUntil, terms, notes, salespersonId } = req.body;
    const quotation = await Quotation.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }
    if (quotation.status === 'converted') {
      return res.status(400).json({ success: false, message: 'Cannot edit a quotation that has already been converted to a Sales Order' });
    }

    const customer = await Customer.findOne({ _id: customerId || quotation.customerId, businessId: req.businessId });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const supplierStateCode = req.business.stateCode || '27';
    const placeOfSupplyStateCode = customer.billingAddress?.stateCode || supplierStateCode;

    const taxCalc = TaxDeterminationService.calculateItemTaxes(
      items,
      supplierStateCode,
      placeOfSupplyStateCode,
      isTaxInclusive
    );

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

    quotation.customerId = customer._id;
    quotation.customerNameSnapshot = customer.name;
    quotation.customerGSTINSnapshot = customer.gstin;
    quotation.billingAddressSnapshot = customer.billingAddress;
    quotation.shippingAddressSnapshot = req.body.shippingAddress || customer.shippingAddress || quotation.shippingAddressSnapshot || customer.billingAddress;
    quotation.placeOfSupply = customer.billingAddress?.state || req.business.state;
    quotation.isInterState = taxCalc.isInterState;
    if (req.body.date) quotation.date = req.body.date;
    if (validUntil !== undefined) quotation.validUntil = validUntil;
    if (salespersonId !== undefined) quotation.salespersonId = salespersonId;
    quotation.items = taxCalc.items;
    quotation.extraCharges = processedExtraCharges;
    quotation.subtotal = taxCalc.subtotal;
    quotation.totalDiscount = taxCalc.totalDiscount;
    quotation.taxableAmount = taxCalc.taxableAmount;
    quotation.cgstTotal = taxCalc.cgstTotal;
    quotation.sgstTotal = taxCalc.sgstTotal;
    quotation.igstTotal = taxCalc.igstTotal;
    quotation.cessTotal = taxCalc.cessTotal;
    quotation.totalTax = taxCalc.totalTax;
    quotation.roundOff = taxCalc.roundOff;
    quotation.grandTotal = finalGrandTotal;
    if (terms !== undefined) quotation.terms = terms;
    if (notes !== undefined) quotation.notes = notes;

    await quotation.save();

    res.status(200).json({ success: true, message: 'Quotation updated successfully', data: quotation });
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
      shippingAddressSnapshot: req.body.shippingAddress || customer.shippingAddress || customer.billingAddress,
      placeOfSupply: customer.billingAddress?.state || req.business.state,
      isInterState: taxCalc.isInterState,
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

exports.getSalesOrderById = async (req, res, next) => {
  try {
    const salesOrder = await SalesOrder.findOne({ _id: req.params.id, businessId: req.businessId })
      .populate('customerId', 'name phone gstin customerType billingAddress shippingAddress currentBalance');
    if (!salesOrder) {
      return res.status(404).json({ success: false, message: 'Sales Order not found' });
    }
    res.status(200).json({ success: true, data: salesOrder });
  } catch (error) {
    next(error);
  }
};

exports.updateSalesOrder = async (req, res, next) => {
  try {
    const { customerId, warehouseId, items, isTaxInclusive, deliveryDate, terms, notes } = req.body;
    const salesOrder = await SalesOrder.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!salesOrder) {
      return res.status(404).json({ success: false, message: 'Sales Order not found' });
    }
    if (['completed', 'cancelled'].includes(salesOrder.status)) {
      return res.status(400).json({ success: false, message: `Cannot edit a ${salesOrder.status} sales order` });
    }

    const customer = await Customer.findOne({ _id: customerId || salesOrder.customerId, businessId: req.businessId });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const supplierStateCode = req.business.stateCode || '27';
    const placeOfSupplyStateCode = customer.billingAddress?.stateCode || supplierStateCode;

    const taxCalc = TaxDeterminationService.calculateItemTaxes(items, supplierStateCode, placeOfSupplyStateCode, isTaxInclusive);

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

    salesOrder.customerId = customer._id;
    salesOrder.customerNameSnapshot = customer.name;
    salesOrder.customerGSTINSnapshot = customer.gstin;
    salesOrder.billingAddressSnapshot = customer.billingAddress;
    salesOrder.shippingAddressSnapshot = req.body.shippingAddress || customer.shippingAddress || salesOrder.shippingAddressSnapshot || customer.billingAddress;
    salesOrder.placeOfSupply = customer.billingAddress?.state || req.business.state;
    salesOrder.isInterState = taxCalc.isInterState;
    if (warehouseId) salesOrder.warehouseId = warehouseId;
    if (req.body.date) salesOrder.date = req.body.date;
    if (deliveryDate !== undefined) salesOrder.deliveryDate = deliveryDate;
    salesOrder.items = taxCalc.items;
    salesOrder.extraCharges = processedExtraCharges;
    salesOrder.subtotal = taxCalc.subtotal;
    salesOrder.totalDiscount = taxCalc.totalDiscount;
    salesOrder.taxableAmount = taxCalc.taxableAmount;
    salesOrder.cgstTotal = taxCalc.cgstTotal;
    salesOrder.sgstTotal = taxCalc.sgstTotal;
    salesOrder.igstTotal = taxCalc.igstTotal;
    salesOrder.cessTotal = taxCalc.cessTotal;
    salesOrder.totalTax = taxCalc.totalTax;
    salesOrder.roundOff = taxCalc.roundOff;
    salesOrder.grandTotal = finalGrandTotal;
    if (terms !== undefined) salesOrder.terms = terms;
    if (notes !== undefined) salesOrder.notes = notes;

    await salesOrder.save();

    res.status(200).json({ success: true, message: 'Sales order updated successfully', data: salesOrder });
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
      deliveryAddressSnapshot: req.body.shippingAddress || req.body.deliveryAddress || customer.shippingAddress || customer.billingAddress,
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

exports.getDeliveryChallanById = async (req, res, next) => {
  try {
    const challan = await DeliveryChallan.findOne({ _id: req.params.id, businessId: req.businessId })
      .populate('customerId', 'name phone gstin customerType billingAddress shippingAddress currentBalance');
    if (!challan) {
      return res.status(404).json({ success: false, message: 'Delivery Challan not found' });
    }
    res.status(200).json({ success: true, data: challan });
  } catch (error) {
    next(error);
  }
};
