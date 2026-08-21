const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  accountName: { type: String, required: true, trim: true }, // e.g. "HDFC Current Account"
  bankName: { type: String, required: true, trim: true },
  accountNumber: { type: String, required: true, trim: true },
  ifscCode: { type: String, required: true, trim: true, uppercase: true },
  branchName: { type: String, trim: true },
  upiId: { type: String, trim: true },
  openingBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  chartOfAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

bankAccountSchema.index({ businessId: 1, accountNumber: 1 }, { unique: true });

module.exports = mongoose.model('BankAccount', bankAccountSchema);
