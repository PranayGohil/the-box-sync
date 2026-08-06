const mongoose = require('mongoose');

const salesOrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'catalog', required: false },
  name: { type: String, required: true },
  hsnCode: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  deliveredQuantity: { type: Number, default: 0 }, // Track delivered qty
  unitPrice: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  taxRate: { type: Number, required: true },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true }
});

const salesOrderSchema = new mongoose.Schema({
  salesOrderNumber: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  expectedDelivery: { type: Date },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  salesPerson: { type: String },
  customerDetails: {
    name: { type: String, required: true },
    gstin: { type: String },
    address: { type: String },
    state: { type: String, required: true },
    phone: { type: String },
    email: { type: String }
  },
  items: [salesOrderItemSchema],
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
    enum: ['Draft', 'Confirmed', 'Partial', 'Completed', 'Cancelled'],
    default: 'Draft'
  },
  notes: { type: String },
  termsAndConditions: { type: String },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

salesOrderSchema.index({ salesOrderNumber: 1 });
salesOrderSchema.index({ shopId: 1, date: -1 });

module.exports = mongoose.model('SalesOrder', salesOrderSchema);
