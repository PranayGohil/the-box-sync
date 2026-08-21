const mongoose = require('mongoose');

// GST Reconciliation Model (GSTR-2B vs Purchase Register)
const gstReconciliationItemSchema = new mongoose.Schema({
  gstin: { type: String, required: true },
  supplierName: { type: String },
  invoiceNo: { type: String, required: true },
  invoiceDate: { type: Date, required: true },
  taxableValue: { type: Number, required: true },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalTax: { type: Number, required: true },
  internalBillId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseBill' },
  status: {
    type: String,
    enum: ['MATCHED', 'MISMATCH_AMOUNT', 'MISSING_IN_BOOKS', 'MISSING_IN_PORTAL', 'DUPLICATE'],
    default: 'MISSING_IN_BOOKS'
  },
  discrepancyDetails: { type: String }
});

const gstReconciliationSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  returnPeriod: { type: String, required: true }, // e.g. "042026"
  reconciliationType: { type: String, enum: ['GSTR-2B', 'GSTR-2A', 'GSTR-1'], default: 'GSTR-2B' },
  uploadedFileName: { type: String },
  totalPortalInvoices: { type: Number, default: 0 },
  totalBooksInvoices: { type: Number, default: 0 },
  matchedCount: { type: Number, default: 0 },
  mismatchCount: { type: Number, default: 0 },
  missingInBooksCount: { type: Number, default: 0 },
  missingInPortalCount: { type: Number, default: 0 },
  items: [gstReconciliationItemSchema],
  reconciledAt: { type: Date, default: Date.now },
  reconciledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// E-Invoice Model & Request Audit Log
const eInvoiceSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  irn: { type: String, required: true, trim: true },
  ackNo: { type: String, required: true },
  ackDate: { type: Date, required: true },
  signedInvoice: { type: String },
  signedQRCode: { type: String, required: true },
  status: { type: String, enum: ['generated', 'cancelled', 'failed'], default: 'generated' },
  cancelReason: { type: String },
  cancelledAt: { type: Date },
  requestPayload: { type: mongoose.Schema.Types.Mixed },
  responsePayload: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// E-Way Bill Model
const eWayBillSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  deliveryChallanId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryChallan' },
  ewbNo: { type: String, required: true, trim: true },
  ewbDate: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  docType: { type: String, default: 'INV' },
  docNo: { type: String, required: true },
  transporterName: { type: String },
  transporterId: { type: String },
  transporterDocNo: { type: String },
  vehicleNo: { type: String, required: true },
  fromPlace: { type: String, required: true },
  toPlace: { type: String, required: true },
  distance: { type: Number, required: true },
  status: { type: String, enum: ['active', 'cancelled', 'extended', 'expired'], default: 'active' },
  cancelReason: { type: String },
  cancelledAt: { type: Date }
}, { timestamps: true });

// Approval Workflow & Request
const approvalRequestSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  module: {
    type: String,
    enum: ['purchase_order', 'sales_order', 'expense', 'credit_note', 'debit_note', 'stock_adjustment'],
    required: true
  },
  recordId: { type: mongoose.Schema.Types.ObjectId, required: true },
  recordNo: { type: String, required: true },
  amount: { type: Number },
  reason: { type: String },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String }
}, { timestamps: true });

// Attachment
const attachmentSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  entityType: { type: String, enum: ['invoice', 'purchase_bill', 'expense', 'customer', 'supplier', 'product', 'company'], required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Import Job (Asynchronous bulk imports)
const importJobSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  entityType: { type: String, enum: ['customers', 'suppliers', 'products', 'opening_stock', 'bank_statement'], required: true },
  fileName: { type: String, required: true },
  totalRows: { type: Number, default: 0 },
  successRows: { type: Number, default: 0 },
  failedRows: { type: Number, default: 0 },
  errors: [{ row: Number, message: String, data: mongoose.Schema.Types.Mixed }],
  status: { type: String, enum: ['pending', 'processing', 'completed', 'completed_with_errors', 'failed'], default: 'processing' },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Document Sequence Model (Atomic safe increment)
const sequenceSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  financialYear: { type: String, required: true },
  documentType: {
    type: String,
    enum: [
      'invoice',
      'quotation',
      'sales_order',
      'delivery_challan',
      'sales_return',
      'credit_note',
      'purchase_order',
      'goods_receipt',
      'purchase_bill',
      'purchase_return',
      'debit_note',
      'payment_in',
      'payment_out',
      'expense',
      'journal',
      'voucher',
      'stock_transfer',
      'stock_adjustment'
    ],
    required: true
  },
  prefix: { type: String, required: true, trim: true },
  lastSequenceNumber: { type: Number, default: 0 }
}, { timestamps: true });

sequenceSchema.index({ businessId: 1, financialYear: 1, documentType: 1, branchId: 1 }, { unique: true });

// In-App Notification
const notificationSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['low_stock', 'overdue_invoice', 'credit_limit', 'batch_expiry', 'approval_request', 'payment_received', 'general'],
    default: 'general'
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  linkUrl: { type: String },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ businessId: 1, isRead: 1, createdAt: -1 });

// Audit Log (Strict Immutable User Actions)
const auditLogSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  action: { type: String, required: true }, // e.g. 'CREATE', 'UPDATE', 'FINALIZE', 'CANCEL', 'DELETE', 'EXPORT'
  module: { type: String, required: true }, // e.g. 'invoices', 'products', 'banking', 'settings'
  recordId: { type: mongoose.Schema.Types.ObjectId },
  recordNo: { type: String },
  previousState: { type: mongoose.Schema.Types.Mixed },
  newState: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

auditLogSchema.index({ businessId: 1, module: 1, timestamp: -1 });

// Payment Webhook Event (Idempotent Webhook Processing)
const paymentWebhookEventSchema = new mongoose.Schema({
  provider: { type: String, required: true }, // e.g. 'razorpay', 'cashfree'
  eventId: { type: String, required: true, unique: true },
  eventType: { type: String },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  signatureVerified: { type: Boolean, default: true },
  isProcessed: { type: Boolean, default: false },
  processedAt: { type: Date },
  error: { type: String }
}, { timestamps: true });

module.exports = {
  GSTReconciliation: mongoose.model('GSTReconciliation', gstReconciliationSchema),
  EInvoice: mongoose.model('EInvoice', eInvoiceSchema),
  EWayBill: mongoose.model('EWayBill', eWayBillSchema),
  ApprovalRequest: mongoose.model('ApprovalRequest', approvalRequestSchema),
  Attachment: mongoose.model('Attachment', attachmentSchema),
  ImportJob: mongoose.model('ImportJob', importJobSchema),
  Sequence: mongoose.model('Sequence', sequenceSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema),
  PaymentWebhookEvent: mongoose.model('PaymentWebhookEvent', paymentWebhookEventSchema)
};
