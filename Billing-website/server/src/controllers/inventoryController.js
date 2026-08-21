const {
  StockBalance,
  StockMovement,
  StockAdjustment,
  StockTransfer,
  ProductBatch,
  ProductSerialNumber,
  Warehouse,
  Product
} = require('../models');
const StockService = require('../services/StockService');
const SequenceService = require('../services/SequenceService');

// @desc    Get Stock Summary across Warehouses
// @route   GET /api/inventory/summary
exports.getStockSummary = async (req, res, next) => {
  try {
    const { warehouseId, productId } = req.query;
    const query = { businessId: req.businessId };
    if (warehouseId) query.warehouseId = warehouseId;
    if (productId) query.productId = productId;

    const balances = await StockBalance.find(query)
      .populate('productId', 'name sku barcode unit purchasePrice sellingPrice minStockAlert itemType')
      .populate('warehouseId', 'name code')
      .populate('batchId', 'batchNumber expiryDate');

    res.status(200).json({
      success: true,
      data: balances
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Stock Movement Ledger / History
// @route   GET /api/inventory/movements
exports.getStockMovements = async (req, res, next) => {
  try {
    const { productId, warehouseId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = { businessId: req.businessId };

    if (productId) query.productId = productId;
    if (warehouseId) query.warehouseId = warehouseId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const total = await StockMovement.countDocuments(query);
    const movements = await StockMovement.find(query)
      .populate('productId', 'name sku unit')
      .populate('warehouseId', 'name code')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: movements,
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

// @desc    Create Stock Adjustment (Physical Reconciliation, Damage, Expiry)
// @route   POST /api/inventory/adjustments
exports.createStockAdjustment = async (req, res, next) => {
  try {
    const { warehouseId, items, notes } = req.body;
    if (!warehouseId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Warehouse and adjustment items are required' });
    }

    const adjustmentNo = await SequenceService.getNextDocumentNumber(req.businessId, 'stock_adjustment', '2026-27');

    const totalAdjustmentValue = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitCost || 0)), 0);

    const adjustment = await StockAdjustment.create({
      businessId: req.businessId,
      warehouseId,
      adjustmentNo,
      date: new Date(),
      items,
      totalAdjustmentValue,
      notes,
      status: 'posted',
      createdBy: req.user._id
    });

    // Apply stock adjustments via StockService
    for (const item of items) {
      if (item.type === 'increase') {
        await StockService.addStock({
          businessId: req.businessId,
          warehouseId,
          items: [{ productId: item.productId, batchId: item.batchId, quantity: item.quantity, rate: item.unitCost || 0 }],
          voucherType: 'adjustment_in',
          voucherNo: adjustmentNo,
          referenceId: adjustment._id,
          userId: req.user._id
        });
      } else {
        await StockService.deductStock({
          businessId: req.businessId,
          warehouseId,
          items: [{ productId: item.productId, batchId: item.batchId, quantity: item.quantity, rate: item.unitCost || 0 }],
          voucherType: 'adjustment_out',
          voucherNo: adjustmentNo,
          referenceId: adjustment._id,
          userId: req.user._id
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Stock adjustment posted successfully',
      data: adjustment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Inter-Warehouse Stock Transfer
// @route   POST /api/inventory/transfers
exports.createStockTransfer = async (req, res, next) => {
  try {
    const { fromWarehouseId, toWarehouseId, items, transporterDetails, notes } = req.body;
    if (!fromWarehouseId || !toWarehouseId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Source warehouse, destination warehouse, and items are required' });
    }

    if (fromWarehouseId === toWarehouseId) {
      return res.status(400).json({ success: false, message: 'Source and destination warehouses cannot be the same' });
    }

    const transferNo = await SequenceService.getNextDocumentNumber(req.businessId, 'stock_transfer', '2026-27');

    const transfer = await StockTransfer.create({
      businessId: req.businessId,
      transferNo,
      date: new Date(),
      fromWarehouseId,
      toWarehouseId,
      items,
      transporterDetails,
      notes,
      status: 'completed',
      createdBy: req.user._id
    });

    // 1. Deduct from Source Warehouse (OUT)
    await StockService.deductStock({
      businessId: req.businessId,
      warehouseId: fromWarehouseId,
      items,
      voucherType: 'transfer_out',
      voucherNo: transferNo,
      referenceId: transfer._id,
      userId: req.user._id
    });

    // 2. Add into Destination Warehouse (IN)
    await StockService.addStock({
      businessId: req.businessId,
      warehouseId: toWarehouseId,
      items,
      voucherType: 'transfer_in',
      voucherNo: transferNo,
      referenceId: transfer._id,
      userId: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Stock transferred successfully between warehouses',
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List Product Batches with Expiry Tracking
// @route   GET /api/inventory/batches
exports.getBatches = async (req, res, next) => {
  try {
    const { productId, warehouseId, nearExpiry } = req.query;
    const query = { businessId: req.businessId, isActive: true };

    if (productId) query.productId = productId;
    if (warehouseId) query.warehouseId = warehouseId;

    if (nearExpiry === 'true') {
      const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      query.expiryDate = { $lte: thirtyDaysLater };
    }

    const batches = await ProductBatch.find(query)
      .populate('productId', 'name sku unit')
      .populate('warehouseId', 'name code')
      .sort({ expiryDate: 1 });

    res.status(200).json({
      success: true,
      data: batches
    });
  } catch (error) {
    next(error);
  }
};
