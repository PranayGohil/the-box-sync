const mongoose = require('mongoose');

// Purchase Line Item Schema
const purchaseItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  hsnSacCode: { type: String, trim: true },
  unit: { type: String, default: 'PCS' },
  orderedQuantity: { type: Number, required: true, min: 0.001 },
  receivedQuantity: { type: Number, default: 0 },
  rejectedQuantity: { type: Number, default: 0 },
  billedQuantity: { type: Number, default: 0 },
  returnedQuantity: { type: Number, default: 0 },
  rate: { type: Number, required: true, min: 0 },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxableValue: { type: Number, required: true, default: 0 },
  taxRate: { type: Number, default: 18 },
  cgstRate: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstRate: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstRate: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  cessRate: { type: Number, default: 0 },
  cessAmount: { type: Number, default: 0 },
  total: { type: Number, required: true, default: 0 },
  batchNumber: { type: String },
  manufacturingDate: { type: Date },
  expiryDate: { type: Date }
});

// Purchase Order
const purchaseOrderSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  poNo: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  expectedDeliveryDate: { type: Date },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplierNameSnapshot: { type: String, required: true },
  supplierGSTINSnapshot: { type: String },
  supplierAddressSnapshot: { type: mongoose.Schema.Types.Mixed },
  placeOfSupply: { type: String, required: true },
  isInterState: { type: Boolean, default: false },
  items: [purchaseItemSchema],
  subtotal: { type: Number, required: true, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  taxableAmount: { type: Number, required: true, default: 0 },
  cgstTotal: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  igstTotal: { type: Number, default: 0 },
  totalTax: { type: Number, required: true, default: 0 },
  roundOff: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  terms: { type: String },
  notes: { type: String },
  status: { type: String, enum: ['draft', 'approved', 'partially_received', 'completed', 'cancelled'], default: 'approved' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
purchaseOrderSchema.index({ businessId: 1, poNo: 1 }, { unique: true });

// Goods Receipt Note (GRN)
const goodsReceiptSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  grnNo: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplierNameSnapshot: { type: String, required: true },
  deliveryChallanNo: { type: String },
  vehicleNo: { type: String },
  items: [purchaseItemSchema],
  stockAdded: { type: Boolean, default: true },
  status: { type: String, enum: ['draft', 'received', 'verified', 'billed', 'cancelled'], default: 'received' },
  notes: { type: String },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
goodsReceiptSchema.index({ businessId: 1, grnNo: 1 }, { unique: true });

// Purchase Bill (Purchase Invoice)
const purchaseBillSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  financialYear: { type: String, required: true },
  billNo: { type: String, required: true, trim: true },
  supplierInvoiceNo: { type: String, required: true, trim: true },
  billDate: { type: Date, required: true, default: Date.now },
  dueDate: { type: Date },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplierNameSnapshot: { type: String, required: true },
  supplierGSTINSnapshot: { type: String },
  supplierPANSnapshot: { type: String },
  supplierAddressSnapshot: { type: mongoose.Schema.Types.Mixed },
  placeOfSupply: { type: String, required: true },
  placeOfSupplyStateCode: { type: String, required: true },
  isInterState: { type: Boolean, default: false },
  reverseCharge: { type: Boolean, default: false },
  purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  goodsReceiptId: { type: mongoose.Schema.Types.ObjectId, ref: 'GoodsReceipt' },
  items: [purchaseItemSchema],
  subtotal: { type: Number, required: true, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  taxableAmount: { type: Number, required: true, default: 0 },
  cgstTotal: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  igstTotal: { type: Number, default: 0 },
  cessTotal: { type: Number, default: 0 },
  totalTax: { type: Number, required: true, default: 0 },
  roundOff: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, required: true, default: 0 },
  paymentStatus: { type: String, enum: ['unpaid', 'partially_paid', 'paid'], default: 'unpaid' },
  journalEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  notes: { type: String },
  status: { type: String, enum: ['draft', 'finalized', 'cancelled'], default: 'finalized' },
  cancellationReason: { type: String },
  cancelledAt: { type: Date },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

purchaseBillSchema.index({ businessId: 1, billNo: 1 }, { unique: true });
purchaseBillSchema.index({ businessId: 1, supplierId: 1 });
purchaseBillSchema.index({ businessId: 1, billDate: -1 });

// Purchase Return
const purchaseReturnSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  returnNo: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  purchaseBillId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseBill', required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplierNameSnapshot: { type: String, required: true },
  items: [purchaseItemSchema],
  taxableAmount: { type: Number, required: true, default: 0 },
  totalTax: { type: Number, required: true, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  reason: { type: String, enum: ['purchase_return', 'damaged_goods', 'defective', 'wrong_delivery', 'other'], default: 'purchase_return' },
  stockDeducted: { type: Boolean, default: true },
  debitNoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'DebitNote' },
  notes: { type: String },
  status: { type: String, enum: ['draft', 'approved', 'processed', 'cancelled'], default: 'processed' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
purchaseReturnSchema.index({ businessId: 1, returnNo: 1 }, { unique: true });

// Debit Note
const debitNoteSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  debitNoteNo: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  originalPurchaseBillId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseBill', required: true },
  originalPurchaseBillNo: { type: String, required: true },
  purchaseReturnId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseReturn' },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplierNameSnapshot: { type: String, required: true },
  supplierGSTINSnapshot: { type: String },
  placeOfSupply: { type: String, required: true },
  isInterState: { type: Boolean, default: false },
  items: [purchaseItemSchema],
  taxableAmount: { type: Number, required: true, default: 0 },
  cgstTotal: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  igstTotal: { type: Number, default: 0 },
  totalTax: { type: Number, required: true, default: 0 },
  roundOff: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  reason: { type: String, enum: ['purchase_return', 'rate_difference', 'discount_claim', 'deficiency', 'other'], default: 'purchase_return' },
  journalEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  status: { type: String, enum: ['draft', 'finalized', 'cancelled'], default: 'finalized' },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
debitNoteSchema.index({ businessId: 1, debitNoteNo: 1 }, { unique: true });

module.exports = {
  PurchaseOrder: mongoose.model('PurchaseOrder', purchaseOrderSchema),
  GoodsReceipt: mongoose.model('GoodsReceipt', goodsReceiptSchema),
  PurchaseBill: mongoose.model('PurchaseBill', purchaseBillSchema),
  PurchaseReturn: mongoose.model('PurchaseReturn', purchaseReturnSchema),
  DebitNote: mongoose.model('DebitNote', debitNoteSchema)
};
