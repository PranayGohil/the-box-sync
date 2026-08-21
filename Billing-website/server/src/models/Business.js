const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  legalName: { type: String, trim: true },
  gstin: { type: String, trim: true, uppercase: true },
  pan: { type: String, trim: true, uppercase: true },
  cin: { type: String, trim: true },
  taxType: { type: String, enum: ['regular', 'composition', 'unregistered', 'sez'], default: 'regular' },
  businessType: { type: String, default: 'Retail / Wholesale' },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, required: true, trim: true },
  stateCode: { type: String, required: true, trim: true },
  pincode: { type: String, trim: true },
  country: { type: String, default: 'India' },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  website: { type: String, trim: true },
  logoUrl: { type: String },
  signatureUrl: { type: String },
  bankDetails: {
    bankName: { type: String, trim: true },
    accountNo: { type: String, trim: true },
    ifsc: { type: String, trim: true, uppercase: true },
    branch: { type: String, trim: true },
    accountHolderName: { type: String, trim: true }
  },
  upiId: { type: String, trim: true },
  currency: { type: String, default: 'INR' },
  currencySymbol: { type: String, default: '₹' },
  currentFinancialYear: { type: String, default: '2026-27' },
  settings: {
    dcStockPolicy: { type: String, enum: ['NONE', 'RESERVE', 'DEDUCT'], default: 'RESERVE' },
    allowNegativeStock: { type: Boolean, default: false },
    defaultTaxRate: { type: Number, default: 18 },
    invoiceTemplate: { type: String, enum: ['classic', 'modern', 'minimal', 'professional', 'thermal'], default: 'modern' },
    termsAndConditions: { type: String, default: '1. Goods once sold will not be taken back without original invoice.\n2. Interest @ 18% p.a. will be charged if payment is not made within due date.' },
    enableEInvoice: { type: Boolean, default: false },
    enableEWayBill: { type: Boolean, default: false },
    stockValuationMethod: { type: String, enum: ['FIFO', 'WEIGHTED_AVERAGE'], default: 'WEIGHTED_AVERAGE' }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

businessSchema.index({ name: 1, isDeleted: 1 });
businessSchema.index({ gstin: 1 });

module.exports = mongoose.model('Business', businessSchema);
