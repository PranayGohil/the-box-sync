const mongoose = require('mongoose');

const purchaseOrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'catalog', required: false },
  name: { type: String, required: true },
  hsnCode: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  receivedQuantity: { type: Number, default: 0 }, // Track received qty
  unitPrice: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  taxRate: { type: Number, required: true },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true }
});

const purchaseOrderSchema = new mongoose.Schema({
  purchaseOrderNumber: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  expectedDelivery: { type: Date },
  warehouse: { type: String },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  
  vendorDetails: {
    name: { type: String, required: true },
    gstin: { type: String },
    address: { type: String },
    state: { type: String, required: true },
    phone: { type: String },
    email: { type: String }
  },

  items: [purchaseOrderItemSchema],

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
    enum: ['Draft', 'Approved', 'Ordered', 'Received', 'Completed', 'Cancelled'],
    default: 'Draft'
  },
  notes: { type: String },
  termsAndConditions: { type: String },
  isDeleted: { type: Boolean, default: false }

}, { timestamps: true });

purchaseOrderSchema.index({ purchaseOrderNumber: 1 });
purchaseOrderSchema.index({ shopId: 1, date: -1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
