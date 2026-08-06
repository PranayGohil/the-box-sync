const mongoose = require('mongoose');

const creditDebitNoteItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hsnCode: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  taxRate: { type: Number, required: true },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true }
});

const creditDebitNoteSchema = new mongoose.Schema({
  noteNumber: { type: String, required: true, unique: true },
  noteType: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
  date: { type: Date, default: Date.now },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: false },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  
  partyDetails: {
    name: { type: String, required: true },
    gstin: { type: String },
    address: { type: String },
    state: { type: String, required: true },
    phone: { type: String },
    email: { type: String }
  },

  items: [creditDebitNoteItemSchema],

  summary: {
    subTotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    totalCGST: { type: Number, default: 0 },
    totalSGST: { type: Number, default: 0 },
    totalIGST: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true }
  },

  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['Draft', 'Approved', 'Cancelled', 'Applied'],
    default: 'Draft'
  },
  notes: { type: String },
  isDeleted: { type: Boolean, default: false }

}, { timestamps: true });

creditDebitNoteSchema.index({ noteNumber: 1 });
creditDebitNoteSchema.index({ shopId: 1, noteType: 1 });

module.exports = mongoose.model('CreditDebitNote', creditDebitNoteSchema);
