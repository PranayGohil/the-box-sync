const mongoose = require('mongoose');

const quotationItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false }, // Optional in case of custom items
  name: { type: String, required: true },
  hsnCode: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  taxRate: { type: Number, required: true }, // e.g., 5, 12, 18, 28
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true } // Including tax
});

const quotationSchema = new mongoose.Schema({
  quotationNumber: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  validUntil: { type: Date },
  
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  
  customerDetails: {
    name: { type: String, required: true },
    gstin: { type: String },
    address: { type: String },
    state: { type: String, required: true }, // Important for CGST/SGST vs IGST
    phone: { type: String },
    email: { type: String }
  },

  items: [quotationItemSchema],

  summary: {
    subTotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    totalCGST: { type: Number, default: 0 },
    totalSGST: { type: Number, default: 0 },
    totalIGST: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true }
  },

  status: {
    type: String,
    enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'INVOICED'],
    default: 'DRAFT'
  },
  
  notes: { type: String },
  termsAndConditions: { type: String }

}, { timestamps: true });

module.exports = mongoose.model('Quotation', quotationSchema);
