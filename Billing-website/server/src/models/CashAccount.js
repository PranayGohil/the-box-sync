const mongoose = require('mongoose');

const cashAccountSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  name: { type: String, required: true, trim: true }, // e.g., "Main Cash Drawer", "Petty Cash"
  openingBalance: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  chartOfAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

cashAccountSchema.index({ businessId: 1, name: 1 });

module.exports = mongoose.model('CashAccount', cashAccountSchema);
