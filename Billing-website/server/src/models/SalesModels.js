const mongoose = require('mongoose');

// Standard Line Item Schema for Sales Documents
const salesItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  hsnSacCode: { type: String, trim: true },
  itemType: { type: String, enum: ['goods', 'service'], default: 'goods' },
  unit: { type: String, default: 'PCS' },
  quantity: { type: Number, required: true, min: 0.001 },
  deliveredQuantity: { type: Number, default: 0 },
  invoicedQuantity: { type: Number, default: 0 },
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
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductBatch' },
  batchNumber: { type: String },
  serialNumbers: [{ type: String }]
});

// Quotation
const quotationSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  quotationNo: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  validUntil: { type: Date },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerNameSnapshot: { type: String, required: true },
  customerGSTINSnapshot: { type: String },
  billingAddressSnapshot: { type: mongoose.Schema.Types.Mixed },
  shippingAddressSnapshot: { type: mongoose.Schema.Types.Mixed },
  placeOfSupply: { type: String, required: true },
  isInterState: { type: Boolean, default: false },
  salespersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salesperson' },
  items: [salesItemSchema],
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
  terms: { type: String },
  notes: { type: String },
  status: { type: String, enum: ['draft', 'sent', 'accepted', 'rejected', 'converted', 'cancelled'], default: 'draft' },
  convertedToOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
  convertedToInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
quotationSchema.index({ businessId: 1, quotationNo: 1 }, { unique: true });

// Sales Order
const salesOrderSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  orderNo: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  deliveryDate: { type: Date },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerNameSnapshot: { type: String, required: true },
  customerGSTINSnapshot: { type: String },
  billingAddressSnapshot: { type: mongoose.Schema.Types.Mixed },
  shippingAddressSnapshot: { type: mongoose.Schema.Types.Mixed },
  placeOfSupply: { type: String, required: true },
  isInterState: { type: Boolean, default: false },
  sourceDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  items: [salesItemSchema],
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
  terms: { type: String },
  notes: { type: String },
  isStockReserved: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'confirmed', 'partially_fulfilled', 'completed', 'cancelled'], default: 'confirmed' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
salesOrderSchema.index({ businessId: 1, orderNo: 1 }, { unique: true });

// Delivery Challan
const deliveryChallanSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  challanNo: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerNameSnapshot: { type: String, required: true },
  customerGSTINSnapshot: { type: String },
  deliveryAddressSnapshot: { type: mongoose.Schema.Types.Mixed },
  challanType: { type: String, enum: ['supply_on_approval', 'job_work', 'for_sale', 'exhibition', 'other'], default: 'for_sale' },
  stockPolicyApplied: { type: String, enum: ['NONE', 'RESERVE', 'DEDUCT'], default: 'DEDUCT' },
  transporterDetails: {
    transporterName: String,
    vehicleNo: String,
    lrNumber: String,
    lrDate: Date,
    eWayBillNo: String
  },
  salesOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
  items: [salesItemSchema],
  subtotal: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'dispatched', 'delivered', 'invoiced', 'returned', 'cancelled'], default: 'dispatched' },
  convertedToInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
deliveryChallanSchema.index({ businessId: 1, challanNo: 1 }, { unique: true });

// GST Tax Invoice
const invoiceSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  financialYear: { type: String, required: true },
  invoiceNo: { type: String, required: true, trim: true },
  invoiceDate: { type: Date, required: true, default: Date.now },
  dueDate: { type: Date },
  invoiceType: { type: String, enum: ['tax_invoice', 'bill_of_supply', 'export_invoice', 'deemed_export'], default: 'tax_invoice' },
  invoiceCategory: { type: String, enum: ['B2B', 'B2C', 'SEZ', 'DEEMED'], default: 'B2B' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerNameSnapshot: { type: String, required: true },
  customerGSTINSnapshot: { type: String },
  customerPANSnapshot: { type: String },
  sellerGSTINSnapshot: { type: String },
  billingAddressSnapshot: { type: mongoose.Schema.Types.Mixed },
  shippingAddressSnapshot: { type: mongoose.Schema.Types.Mixed },
  placeOfSupply: { type: String, required: true },
  placeOfSupplyStateCode: { type: String, required: true },
  isInterState: { type: Boolean, default: false },
  reverseCharge: { type: Boolean, default: false },
  sourceDocumentType: { type: String, enum: ['direct', 'quotation', 'sales_order', 'delivery_challan', 'pos'], default: 'direct' },
  sourceDocumentId: { type: mongoose.Schema.Types.ObjectId },
  salespersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salesperson' },
  items: [salesItemSchema],
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
  printTemplate: { type: String, enum: ['classic', 'modern', 'minimal', 'professional', 'thermal'], default: 'modern' },
  qrCodeString: { type: String },
  eInvoiceDetails: {
    irn: String,
    ackNo: String,
    ackDate: Date,
    signedQRCode: String,
    status: { type: String, enum: ['pending', 'generated', 'failed', 'cancelled'], default: 'pending' }
  },
  eWayBillDetails: {
    ewbNo: String,
    ewbDate: Date,
    validUntil: Date,
    transporterName: String,
    vehicleNo: String,
    status: { type: String, enum: ['pending', 'generated', 'cancelled'], default: 'pending' }
  },
  terms: { type: String },
  notes: { type: String },
  status: { type: String, enum: ['draft', 'finalized', 'cancelled'], default: 'finalized' },
  cancellationReason: { type: String },
  cancelledAt: { type: Date },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

invoiceSchema.index({ businessId: 1, invoiceNo: 1 }, { unique: true });
invoiceSchema.index({ businessId: 1, invoiceDate: -1 });
invoiceSchema.index({ businessId: 1, customerId: 1 });
invoiceSchema.index({ businessId: 1, paymentStatus: 1 });
invoiceSchema.index({ businessId: 1, status: 1 });

// Sales Return
const salesReturnSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  returnNo: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerNameSnapshot: { type: String, required: true },
  items: [salesItemSchema],
  taxableAmount: { type: Number, required: true, default: 0 },
  totalTax: { type: Number, required: true, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  reason: { type: String, enum: ['sales_return', 'damaged_goods', 'quality_issue', 'wrong_item', 'other'], default: 'sales_return' },
  stockRestocked: { type: Boolean, default: true },
  creditNoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'CreditNote' },
  notes: { type: String },
  status: { type: String, enum: ['draft', 'approved', 'processed', 'cancelled'], default: 'processed' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
salesReturnSchema.index({ businessId: 1, returnNo: 1 }, { unique: true });

// Credit Note
const creditNoteSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  creditNoteNo: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  originalInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  originalInvoiceNo: { type: String, required: true },
  salesReturnId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesReturn' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerNameSnapshot: { type: String, required: true },
  customerGSTINSnapshot: { type: String },
  placeOfSupply: { type: String, required: true },
  isInterState: { type: Boolean, default: false },
  items: [salesItemSchema],
  taxableAmount: { type: Number, required: true, default: 0 },
  cgstTotal: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  igstTotal: { type: Number, default: 0 },
  totalTax: { type: Number, required: true, default: 0 },
  roundOff: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  reason: { type: String, enum: ['sales_return', 'rate_difference', 'discount_adjustment', 'deficiency_in_service', 'other'], default: 'sales_return' },
  journalEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  status: { type: String, enum: ['draft', 'finalized', 'cancelled'], default: 'finalized' },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
creditNoteSchema.index({ businessId: 1, creditNoteNo: 1 }, { unique: true });

// Recurring Invoice
const recurringInvoiceSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], default: 'monthly' },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  nextRunDate: { type: Date, required: true },
  lastRunDate: { type: Date },
  items: [salesItemSchema],
  subtotal: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  autoSendEmail: { type: Boolean, default: false },
  generatedInvoices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }],
  status: { type: String, enum: ['active', 'paused', 'completed', 'cancelled'], default: 'active' }
}, { timestamps: true });

module.exports = {
  Quotation: mongoose.model('Quotation', quotationSchema),
  SalesOrder: mongoose.model('SalesOrder', salesOrderSchema),
  DeliveryChallan: mongoose.model('DeliveryChallan', deliveryChallanSchema),
  Invoice: mongoose.model('Invoice', invoiceSchema),
  SalesReturn: mongoose.model('SalesReturn', salesReturnSchema),
  CreditNote: mongoose.model('CreditNote', creditNoteSchema),
  RecurringInvoice: mongoose.model('RecurringInvoice', recurringInvoiceSchema)
};
