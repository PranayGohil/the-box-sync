const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  voucherNo: { type: String, required: true, trim: true },
  voucherType: {
    type: String,
    enum: ['receipt', 'payment', 'contra', 'journal', 'sales', 'purchase', 'expense', 'credit_note', 'debit_note'],
    required: true
  },
  date: { type: Date, required: true, default: Date.now },
  journalEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  partyType: { type: String, enum: ['customer', 'supplier', 'other', 'none'], default: 'none' },
  partyId: { type: mongoose.Schema.Types.ObjectId },
  partyName: { type: String, trim: true },
  amount: { type: Number, required: true },
  paymentMode: { type: String, enum: ['cash', 'bank', 'upi', 'cheque', 'card', 'adjustment', 'none'], default: 'cash' },
  referenceNo: { type: String, trim: true },
  chequeNo: { type: String, trim: true },
  chequeDate: { type: Date },
  bankAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
  cashAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'CashAccount' },
  narration: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['draft', 'posted', 'cancelled'], default: 'posted' }
}, {
  timestamps: true
});

voucherSchema.index({ businessId: 1, voucherNo: 1 }, { unique: true });
voucherSchema.index({ businessId: 1, voucherType: 1, date: -1 });

module.exports = mongoose.model('Voucher', voucherSchema);
