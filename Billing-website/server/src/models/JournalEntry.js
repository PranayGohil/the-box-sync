const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  financialYear: { type: String, required: true },
  entryNo: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  voucherType: {
    type: String,
    enum: [
      'sales',
      'purchase',
      'receipt',
      'payment',
      'contra',
      'journal',
      'expense',
      'credit_note',
      'debit_note',
      'sales_return',
      'purchase_return',
      'opening_balance',
      'adjustment'
    ],
    required: true
  },
  voucherNo: { type: String, trim: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  referenceModel: { type: String },
  narration: { type: String, trim: true },
  totalDebit: { type: Number, required: true },
  totalCredit: { type: Number, required: true },
  isReversed: { type: Boolean, default: false },
  reversedByEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  reversalReason: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

journalEntrySchema.index({ businessId: 1, entryNo: 1 }, { unique: true });
journalEntrySchema.index({ businessId: 1, date: -1 });
journalEntrySchema.index({ businessId: 1, voucherType: 1 });
journalEntrySchema.index({ referenceId: 1 });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
