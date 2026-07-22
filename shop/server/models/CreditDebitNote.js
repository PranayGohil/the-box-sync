const mongoose = require('mongoose');

const creditDebitNoteSchema = new mongoose.Schema({
  noteNumber: { type: String, required: true, unique: true },
  noteType: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
  date: { type: Date, default: Date.now },
  
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  
  reason: { type: String, required: true },
  
  adjustments: {
    taxableValue: { type: Number, required: true }, // The difference in base value
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true }
  },

  status: {
    type: String,
    enum: ['DRAFT', 'ISSUED', 'CANCELLED'],
    default: 'DRAFT'
  },
  
  notes: { type: String }

}, { timestamps: true });

module.exports = mongoose.model('CreditDebitNote', creditDebitNoteSchema);
