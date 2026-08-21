const mongoose = require('mongoose');

const bankTransactionSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  bankAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
  date: { type: Date, required: true, default: Date.now },
  type: { type: String, enum: ['deposit', 'withdrawal', 'transfer', 'charge', 'interest'], required: true },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number },
  referenceNo: { type: String, trim: true },
  description: { type: String, trim: true },
  voucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' },
  isReconciled: { type: Boolean, default: false },
  reconciledDate: { type: Date },
  reconciledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

bankTransactionSchema.index({ businessId: 1, bankAccountId: 1, date: -1 });

module.exports = mongoose.model('BankTransaction', bankTransactionSchema);
