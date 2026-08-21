const mongoose = require('mongoose');

const bankReconciliationSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  bankAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
  statementStartDate: { type: Date, required: true },
  statementEndDate: { type: Date, required: true },
  statementClosingBalance: { type: Number, required: true },
  booksClosingBalance: { type: Number, required: true },
  difference: { type: Number, default: 0 },
  matchedTransactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BankTransaction' }],
  unmatchedTransactions: [{
    date: Date,
    description: String,
    referenceNo: String,
    withdrawal: Number,
    deposit: Number,
    status: { type: String, default: 'unmatched' }
  }],
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  completedAt: { type: Date },
  reconciledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('BankReconciliation', bankReconciliationSchema);
