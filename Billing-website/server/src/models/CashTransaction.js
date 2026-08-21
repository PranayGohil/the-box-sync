const mongoose = require('mongoose');

const cashTransactionSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  cashAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'CashAccount', required: true },
  date: { type: Date, required: true, default: Date.now },
  type: { type: String, enum: ['receipt', 'payment', 'transfer_in', 'transfer_out'], required: true },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number },
  referenceNo: { type: String, trim: true },
  description: { type: String, trim: true },
  voucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' }
}, {
  timestamps: true
});

cashTransactionSchema.index({ businessId: 1, cashAccountId: 1, date: -1 });

module.exports = mongoose.model('CashTransaction', cashTransactionSchema);
