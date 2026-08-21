const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true },
  businessName: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  gstin: { type: String, trim: true, uppercase: true },
  pan: { type: String, trim: true, uppercase: true },
  customerType: { type: String, enum: ['B2B', 'B2C', 'SEZ', 'DEEMED_EXPORT', 'OVERSEAS'], default: 'B2C' },
  billingAddress: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, required: true, trim: true },
    stateCode: { type: String, required: true, trim: true },
    pincode: { type: String, trim: true },
    country: { type: String, default: 'India' }
  },
  shippingAddress: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    stateCode: { type: String, trim: true },
    pincode: { type: String, trim: true },
    country: { type: String, default: 'India' }
  },
  creditLimit: { type: Number, default: 0 },
  creditDays: { type: Number, default: 30 },
  creditBlock: { type: Boolean, default: false },
  openingBalance: { type: Number, default: 0 },
  openingBalanceType: { type: String, enum: ['Dr', 'Cr'], default: 'Dr' },
  currentBalance: { type: Number, default: 0 }, // Optimized cached receivable balance
  priceListId: { type: mongoose.Schema.Types.ObjectId, ref: 'PriceList' },
  chartOfAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  salespersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salesperson' },
  notes: { type: String },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

customerSchema.index({ businessId: 1, name: 1 });
customerSchema.index({ businessId: 1, phone: 1 });
customerSchema.index({ businessId: 1, gstin: 1 });
customerSchema.index({ businessId: 1, isDeleted: 1 });

module.exports = mongoose.model('Customer', customerSchema);
