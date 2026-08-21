const mongoose = require('mongoose');

const productBatchSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  batchNumber: { type: String, required: true, trim: true, uppercase: true },
  manufacturingDate: { type: Date },
  expiryDate: { type: Date },
  purchaseRate: { type: Number, default: 0 },
  sellingRate: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  reservedQuantity: { type: Number, default: 0 },
  availableQuantity: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

productBatchSchema.index({ businessId: 1, productId: 1, warehouseId: 1, batchNumber: 1 }, { unique: true });
productBatchSchema.index({ businessId: 1, expiryDate: 1 });

const productSerialNumberSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  serialNumber: { type: String, required: true, trim: true, uppercase: true },
  purchaseBillId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseBill' },
  salesInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  warrantyStartDate: { type: Date },
  warrantyEndDate: { type: Date },
  status: {
    type: String,
    enum: ['in_stock', 'reserved', 'sold', 'returned', 'damaged'],
    default: 'in_stock'
  }
}, {
  timestamps: true
});

productSerialNumberSchema.index({ businessId: 1, productId: 1, serialNumber: 1 }, { unique: true });
productSerialNumberSchema.index({ businessId: 1, status: 1 });

module.exports = {
  ProductBatch: mongoose.model('ProductBatch', productBatchSchema),
  ProductSerialNumber: mongoose.model('ProductSerialNumber', productSerialNumberSchema)
};
