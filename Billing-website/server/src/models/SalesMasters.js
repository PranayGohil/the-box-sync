const mongoose = require('mongoose');

const priceListItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  minQuantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 }
});

const priceListSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true }, // e.g. "Wholesale Tier 1", "Retail Standard"
  type: { type: String, enum: ['retail', 'wholesale', 'dealer', 'distributor', 'custom'], default: 'retail' },
  currency: { type: String, default: 'INR' },
  items: [priceListItemSchema],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

priceListSchema.index({ businessId: 1, name: 1 }, { unique: true });

const salespersonSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true },
  commissionPercentage: { type: Number, default: 0 },
  targetAmount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = {
  PriceList: mongoose.model('PriceList', priceListSchema),
  Salesperson: mongoose.model('Salesperson', salespersonSchema)
};
