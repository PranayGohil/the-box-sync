const { StockBalance, StockMovement, Product, ProductBatch, StockReservation, Business } = require('../models');

class StockService {
  /**
   * Deduct stock from warehouse & batch (e.g. Sales Invoice, Delivery Challan, Purchase Return)
   */
  static async deductStock({
    businessId,
    branchId = null,
    warehouseId,
    items,
    voucherType,
    voucherNo,
    referenceId,
    userId
  }) {
    const business = await Business.findById(businessId);
    const allowNegative = business?.settings?.allowNegativeStock ?? false;

    for (const item of items) {
      if (!item.productId || item.itemType === 'service') continue;

      const qty = Number(item.quantity) || 0;
      if (qty <= 0) continue;

      // Find or create StockBalance for this warehouse
      let balance = await StockBalance.findOne({
        businessId,
        warehouseId,
        productId: item.productId,
        batchId: item.batchId || null
      });

      const currentQty = balance ? balance.quantity : 0;
      if (!allowNegative && currentQty < qty) {
        throw new Error(`Insufficient stock for product "${item.name}". Available: ${currentQty}, Required: ${qty}`);
      }

      const newQty = currentQty - qty;

      if (balance) {
        balance.quantity = newQty;
        balance.availableQuantity = Math.max(0, newQty - (balance.reservedQuantity || 0));
        await balance.save();
      } else {
        await StockBalance.create({
          businessId,
          branchId,
          warehouseId,
          productId: item.productId,
          batchId: item.batchId || null,
          quantity: newQty,
          availableQuantity: Math.max(0, newQty),
          averageCost: item.rate || 0
        });
      }

      // If batch is specified, update batch quantity
      if (item.batchId) {
        await ProductBatch.findByIdAndUpdate(item.batchId, {
          $inc: { quantity: -qty, availableQuantity: -qty }
        });
      }

      // Record authoritative immutable stock movement
      await StockMovement.create({
        businessId,
        branchId,
        warehouseId,
        productId: item.productId,
        batchId: item.batchId || null,
        voucherType,
        voucherNo,
        referenceId,
        movementType: 'OUT',
        quantity: qty,
        unitCost: item.rate || 0,
        totalValue: qty * (item.rate || 0),
        balanceStockAfter: newQty,
        date: new Date(),
        createdBy: userId
      });

      // Update cached total product stock
      await StockService.recalculateProductTotalStock(businessId, item.productId);
    }
  }

  /**
   * Add stock into warehouse & batch (e.g. Purchase Bill, GRN, Sales Return, Stock Adjustment IN)
   */
  static async addStock({
    businessId,
    branchId = null,
    warehouseId,
    items,
    voucherType,
    voucherNo,
    referenceId,
    userId
  }) {
    for (const item of items) {
      if (!item.productId || item.itemType === 'service') continue;

      const qty = Number(item.quantity || item.receivedQuantity) || 0;
      if (qty <= 0) continue;

      // Check or handle Batch creation/lookup
      let batchId = item.batchId;
      if (!batchId && item.batchNumber) {
        let batch = await ProductBatch.findOne({
          businessId,
          productId: item.productId,
          warehouseId,
          batchNumber: item.batchNumber.trim().toUpperCase()
        });

        if (!batch) {
          batch = await ProductBatch.create({
            businessId,
            productId: item.productId,
            warehouseId,
            batchNumber: item.batchNumber.trim().toUpperCase(),
            manufacturingDate: item.manufacturingDate,
            expiryDate: item.expiryDate,
            purchaseRate: item.rate || 0,
            quantity: qty,
            availableQuantity: qty
          });
        } else {
          batch.quantity += qty;
          batch.availableQuantity += qty;
          await batch.save();
        }
        batchId = batch._id;
      }

      // Update StockBalance
      let balance = await StockBalance.findOne({
        businessId,
        warehouseId,
        productId: item.productId,
        batchId: batchId || null
      });

      let newQty = qty;
      let newAvgCost = item.rate || 0;

      if (balance) {
        const totalOldVal = balance.quantity * (balance.averageCost || 0);
        const totalNewVal = qty * (item.rate || 0);
        newQty = balance.quantity + qty;
        newAvgCost = newQty > 0 ? (totalOldVal + totalNewVal) / newQty : item.rate;

        balance.quantity = newQty;
        balance.availableQuantity = Math.max(0, newQty - (balance.reservedQuantity || 0));
        balance.averageCost = newAvgCost;
        await balance.save();
      } else {
        await StockBalance.create({
          businessId,
          branchId,
          warehouseId,
          productId: item.productId,
          batchId: batchId || null,
          quantity: newQty,
          availableQuantity: newQty,
          averageCost: newAvgCost
        });
      }

      // Record authoritative immutable stock movement
      await StockMovement.create({
        businessId,
        branchId,
        warehouseId,
        productId: item.productId,
        batchId: batchId || null,
        voucherType,
        voucherNo,
        referenceId,
        movementType: 'IN',
        quantity: qty,
        unitCost: item.rate || 0,
        totalValue: qty * (item.rate || 0),
        balanceStockAfter: newQty,
        date: new Date(),
        createdBy: userId
      });

      // Update cached total product stock
      await StockService.recalculateProductTotalStock(businessId, item.productId);
    }
  }

  /**
   * Recalculate cached Product.currentStock from all warehouse balances
   */
  static async recalculateProductTotalStock(businessId, productId) {
    const balances = await StockBalance.find({ businessId, productId });
    const totalStock = balances.reduce((sum, b) => sum + (b.quantity || 0), 0);
    await Product.findByIdAndUpdate(productId, { currentStock: totalStock });
  }

  /**
   * Reserve Stock for Sales Orders
   */
  static async reserveStock(businessId, salesOrderId, warehouseId, items) {
    for (const item of items) {
      if (!item.productId || item.itemType === 'service') continue;
      const qty = Number(item.quantity) || 0;

      await StockReservation.create({
        businessId,
        salesOrderId,
        warehouseId,
        productId: item.productId,
        batchId: item.batchId || null,
        quantity: qty,
        status: 'active'
      });

      await StockBalance.findOneAndUpdate(
        { businessId, warehouseId, productId: item.productId, batchId: item.batchId || null },
        { $inc: { reservedQuantity: qty, availableQuantity: -qty } }
      );
    }
  }

  /**
   * Release Stock Reservation (e.g. when Sales Order is cancelled or fulfilled)
   */
  static async releaseStockReservation(businessId, salesOrderId) {
    const reservations = await StockReservation.find({ businessId, salesOrderId, status: 'active' });
    for (const res of reservations) {
      await StockBalance.findOneAndUpdate(
        { businessId, warehouseId: res.warehouseId, productId: res.productId, batchId: res.batchId || null },
        { $inc: { reservedQuantity: -res.quantity, availableQuantity: res.quantity } }
      );
      res.status = 'released';
      await res.save();
    }
  }
}

module.exports = StockService;
