const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true },
  companyName: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  gstin: { type: String, trim: true, uppercase: true },
  pan: { type: String, trim: true, uppercase: true },
  supplierType: { type: String, enum: ['regular', 'composition', 'unregistered', 'sez', 'import'], default: 'regular' },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, required: true, trim: true },
    stateCode: { type: String, required: true, trim: true },
    pincode: { type: String, trim: true },
    country: { type: String, default: 'India' }
  },
  bankDetails: {
    bankName: { type: String, trim: true },
    accountNo: { type: String, trim: true },
    ifsc: { type: String, trim: true, uppercase: true },
    branch: { type: String, trim: true }
  },
  creditDays: { type: Number, default: 30 },
  openingBalance: { type: Number, default: 0 },
  openingBalanceType: { type: String, enum: ['Cr', 'Dr'], default: 'Cr' },
  currentBalance: { type: Number, default: 0 }, // Optimized cached payable balance
  chartOfAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  tdsApplicable: { type: Boolean, default: false },
  tdsSectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'TDSSection' },
  notes: { type: String },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

supplierSchema.index({ businessId: 1, name: 1 });
supplierSchema.index({ businessId: 1, phone: 1 });
supplierSchema.index({ businessId: 1, gstin: 1 });
supplierSchema.index({ businessId: 1, isDeleted: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
