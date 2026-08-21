const mongoose = require('mongoose');

// Optimized stock balance per product / warehouse / batch
const stockBalanceSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductBatch' },
  quantity: { type: Number, default: 0 },
  reservedQuantity: { type: Number, default: 0 },
  availableQuantity: { type: Number, default: 0 },
  averageCost: { type: Number, default: 0 }
}, {
  timestamps: true
});

stockBalanceSchema.index({ businessId: 1, warehouseId: 1, productId: 1, batchId: 1 }, { unique: true });
stockBalanceSchema.index({ businessId: 1, productId: 1 });

// Authoritative immutable stock movement history
const stockMovementSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductBatch' },
  voucherType: {
    type: String,
    enum: [
      'invoice',
      'sales_return',
      'purchase_bill',
      'purchase_return',
      'delivery_challan',
      'grn',
      'adjustment_in',
      'adjustment_out',
      'transfer_in',
      'transfer_out',
      'opening_stock'
    ],
    required: true
  },
  voucherNo: { type: String, trim: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  movementType: { type: String, enum: ['IN', 'OUT'], required: true },
  quantity: { type: Number, required: true },
  unitCost: { type: Number, default: 0 },
  totalValue: { type: Number, default: 0 },
  balanceStockAfter: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

stockMovementSchema.index({ businessId: 1, productId: 1, date: -1 });
stockMovementSchema.index({ businessId: 1, warehouseId: 1, date: -1 });
stockMovementSchema.index({ referenceId: 1 });

// Stock Reservation for Sales Orders
const stockReservationSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  salesOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductBatch' },
  quantity: { type: Number, required: true },
  status: { type: String, enum: ['active', 'fulfilled', 'released', 'cancelled'], default: 'active' }
}, {
  timestamps: true
});

// Stock Adjustment (Physical Reconciliation, Damage, Expiry)
const stockAdjustmentItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductBatch' },
  type: { type: String, enum: ['increase', 'decrease'], required: true },
  quantity: { type: Number, required: true, min: 0.001 },
  unitCost: { type: Number, default: 0 },
  totalValue: { type: Number, default: 0 },
  reason: { type: String, enum: ['inventory_count', 'damaged', 'expired', 'theft', 'sample', 'other'], default: 'inventory_count' }
});

const stockAdjustmentSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  adjustmentNo: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  items: [stockAdjustmentItemSchema],
  totalAdjustmentValue: { type: Number, default: 0 },
  notes: { type: String },
  status: { type: String, enum: ['draft', 'approved', 'posted', 'cancelled'], default: 'posted' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});
stockAdjustmentSchema.index({ businessId: 1, adjustmentNo: 1 }, { unique: true });

// Inter-warehouse Stock Transfer
const stockTransferItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductBatch' },
  quantity: { type: Number, required: true, min: 0.001 },
  unitCost: { type: Number, default: 0 }
});

const stockTransferSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  transferNo: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  fromWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  toWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  items: [stockTransferItemSchema],
  status: { type: String, enum: ['draft', 'in_transit', 'completed', 'cancelled'], default: 'completed' },
  transporterDetails: {
    transporterName: String,
    vehicleNo: String,
    trackingNo: String
  },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});
stockTransferSchema.index({ businessId: 1, transferNo: 1 }, { unique: true });

module.exports = {
  StockBalance: mongoose.model('StockBalance', stockBalanceSchema),
  StockMovement: mongoose.model('StockMovement', stockMovementSchema),
  StockReservation: mongoose.model('StockReservation', stockReservationSchema),
  StockAdjustment: mongoose.model('StockAdjustment', stockAdjustmentSchema),
  StockTransfer: mongoose.model('StockTransfer', stockTransferSchema)
};
