const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
  name: { type: String, required: true },
  hsnCode: { type: String },
  serialNumbers: [{ type: String }], // Useful for electronics/mobiles
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  taxRate: { type: Number, required: true },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' }, // If converted from quote
  date: { type: Date, default: Date.now },
  dueDate: { type: Date },

  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },

  customerDetails: {
    name: { type: String, required: true },
    gstin: { type: String },
    address: { type: String },
    state: { type: String, required: true },
    phone: { type: String },
    email: { type: String }
  },

  items: [invoiceItemSchema],

  summary: {
    subTotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    totalCGST: { type: Number, default: 0 },
    totalSGST: { type: Number, default: 0 },
    totalIGST: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true } // Subtotal + Tax
  },

  tdsDetails: {
    isTDSDeducted: { type: Boolean, default: false },
    tdsPercentage: { type: Number, default: 0 },
    tdsAmount: { type: Number, default: 0 },
    tdsType: { type: String, enum: ['RECEIVABLE', 'PAYABLE', 'NONE'], default: 'NONE' }
  },

  paymentStatus: {
    type: String,
    enum: ['UNPAID', 'PARTIAL', 'PAID'],
    default: 'UNPAID'
  },
  
  amountDue: { type: Number, required: true }, // Should initially equal grandTotal - tdsAmount
  
  notes: { type: String },
  termsAndConditions: { type: String }

}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
