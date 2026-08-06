const mongoose = require('mongoose');

const ledgerEntryItemSchema = new mongoose.Schema({
  accountName: { type: String, required: true },
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 }
});

const ledgerSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  date: { type: Date, default: Date.now },
  referenceModel: { type: String, enum: ['Invoice', 'CreditDebitNote', 'SalesOrder', 'PurchaseOrder'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  description: { type: String },
  entries: [ledgerEntryItemSchema],
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

ledgerSchema.index({ shopId: 1, date: -1 });
ledgerSchema.index({ referenceModel: 1, referenceId: 1 });

module.exports = mongoose.model('Ledger', ledgerSchema);
