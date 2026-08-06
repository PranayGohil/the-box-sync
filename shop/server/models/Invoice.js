const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'catalog', required: false },
  name: { type: String, required: true },
  hsnCode: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, default: 'pcs' },
  rate: { type: Number, required: true }, // Unit price
  discount: { type: Number, default: 0 }, // Discount per item or percentage
  taxableAmount: { type: Number, required: true },
  gstPercentage: { type: Number, required: true },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  cess: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  salesOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
  date: { type: Date, default: Date.now },
  dueDate: { type: Date },

  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },

  customerDetails: {
    name: { type: String, required: true },
    gstin: { type: String },
    billingAddress: { type: String },
    shippingAddress: { type: String },
    state: { type: String, required: true },
    stateCode: { type: String },
    phone: { type: String },
    email: { type: String }
  },

  placeOfSupply: { type: String },
  reverseCharge: { type: Boolean, default: false },
  paymentTerms: { type: String },
  salesPerson: { type: String },
  orderReference: { type: String },

  items: [invoiceItemSchema],

  summary: {
    taxableValue: { type: Number, required: true },
    cgstTotal: { type: Number, default: 0 },
    sgstTotal: { type: Number, default: 0 },
    igstTotal: { type: Number, default: 0 },
    cessTotal: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    amountInWords: { type: String }
  },

  status: {
    type: String,
    enum: ['Draft', 'Saved', 'Paid', 'Partial Paid', 'Unpaid', 'Cancelled'],
    default: 'Saved'
  },

  payments: [
    {
      method: { type: String, enum: ['Cash', 'Card', 'UPI', 'Bank', 'Wallet'] },
      amount: { type: Number, required: true },
      transactionId: { type: String },
      date: { type: Date, default: Date.now }
    }
  ],

  amountDue: { type: Number, required: true },
  notes: { type: String },
  termsAndConditions: { type: String },

  tdsDetails: {
    isTDSDeducted: { type: Boolean, default: false },
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    rateType: { type: String, enum: ['percentage', 'amount'], default: 'percentage' },
    value: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },

  extraDetails: {
    isApplied: { type: Boolean, default: false },
    name: { type: String, default: '' },
    rateType: { type: String, enum: ['percentage', 'amount'], default: 'amount' },
    value: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },

  isDeleted: { type: Boolean, default: false }

}, { timestamps: true });

invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ shopId: 1, date: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
