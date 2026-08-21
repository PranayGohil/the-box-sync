const mongoose = require('mongoose');

const journalEntryLineSchema = new mongoose.Schema({
  journalEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry', required: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount', required: true },
  partyType: { type: String, enum: ['customer', 'supplier', 'employee', 'none'], default: 'none' },
  partyId: { type: mongoose.Schema.Types.ObjectId },
  debit: { type: Number, default: 0, min: 0 },
  credit: { type: Number, default: 0, min: 0 },
  narration: { type: String, trim: true },
  date: { type: Date, required: true }
}, {
  timestamps: true
});

journalEntryLineSchema.index({ journalEntryId: 1 });
journalEntryLineSchema.index({ businessId: 1, accountId: 1, date: -1 });
journalEntryLineSchema.index({ businessId: 1, partyId: 1, date: -1 });

module.exports = mongoose.model('JournalEntryLine', journalEntryLineSchema);
