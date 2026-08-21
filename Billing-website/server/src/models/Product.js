const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true },
  itemType: { type: String, enum: ['goods', 'service'], default: 'goods' },
  sku: { type: String, trim: true, uppercase: true },
  barcode: { type: String, trim: true },
  hsnSacCode: { type: String, trim: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
  alternateUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
  unitConversionFactor: { type: Number, default: 1 }, // e.g. 1 Box = 12 Pieces
  purchasePrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, required: true, default: 0 },
  wholesalePrice: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  taxRate: { type: Number, default: 18 },
  isTaxInclusive: { type: Boolean, default: false },
  cessRate: { type: Number, default: 0 },
  minStockAlert: { type: Number, default: 5 },
  maxStock: { type: Number },
  hasBatch: { type: Boolean, default: false },
  hasSerial: { type: Boolean, default: false },
  openingStock: { type: Number, default: 0 },
  openingStockValue: { type: Number, default: 0 },
  currentStock: { type: Number, default: 0 }, // Optimized cached stock balance across all warehouses
  description: { type: String },
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

productSchema.index({ businessId: 1, name: 1 });
productSchema.index({ businessId: 1, sku: 1 });
productSchema.index({ businessId: 1, barcode: 1 });
productSchema.index({ businessId: 1, hsnSacCode: 1 });
productSchema.index({ businessId: 1, isDeleted: 1 });

module.exports = mongoose.model('Product', productSchema);
