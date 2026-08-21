const mongoose = require('mongoose');

// Payment (Payment In / Payment Out)
const paymentSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  paymentNo: { type: String, required: true, trim: true },
  paymentType: { type: String, enum: ['in', 'out'], required: true }, // 'in' = from Customer, 'out' = to Supplier / Vendor
  partyType: { type: String, enum: ['customer', 'supplier', 'other'], required: true },
  partyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  partyNameSnapshot: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  amount: { type: Number, required: true, min: 0.01 },
  unallocatedAmount: { type: Number, default: 0 },
  paymentMode: { type: String, enum: ['cash', 'bank', 'upi', 'card', 'cheque', 'neft_rtgs', 'online'], default: 'cash' },
  referenceNo: { type: String, trim: true },
  bankAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
  cashAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'CashAccount' },
  chequeNo: { type: String, trim: true },
  chequeDate: { type: Date },
  journalEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  notes: { type: String },
  status: { type: String, enum: ['draft', 'completed', 'cancelled'], default: 'completed' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

paymentSchema.index({ businessId: 1, paymentNo: 1 }, { unique: true });
paymentSchema.index({ businessId: 1, partyId: 1, date: -1 });

// Payment Allocation to individual invoices/bills
const paymentAllocationSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
  documentType: { type: String, enum: ['invoice', 'purchase_bill', 'debit_note', 'credit_note'], required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  documentNo: { type: String, required: true },
  allocatedAmount: { type: Number, required: true, min: 0.01 },
  date: { type: Date, required: true, default: Date.now }
}, { timestamps: true });

paymentAllocationSchema.index({ paymentId: 1 });
paymentAllocationSchema.index({ documentId: 1 });

// Expense Master Category
const expenseCategorySchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true },
  chartOfAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
expenseCategorySchema.index({ businessId: 1, name: 1 }, { unique: true });

// Expense
const expenseSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  expenseNo: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseCategory' },
  categoryName: { type: String, required: true },
  vendorName: { type: String, trim: true },
  vendorGSTIN: { type: String, trim: true, uppercase: true },
  chartOfAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' }, // Debit account (Expense)
  amount: { type: Number, required: true, min: 0.01 }, // Taxable / Gross amount
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  tdsSectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'TDSSection' },
  tdsRate: { type: Number, default: 0 },
  tdsAmount: { type: Number, default: 0 },
  netPayable: { type: Number, required: true },
  paymentMode: { type: String, enum: ['cash', 'bank', 'upi', 'card', 'cheque', 'credit'], default: 'cash' },
  paidFromAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' }, // Credit account (Cash/Bank)
  referenceNo: { type: String, trim: true },
  receiptUrl: { type: String },
  journalEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  notes: { type: String },
  status: { type: String, enum: ['pending_approval', 'approved', 'paid', 'cancelled'], default: 'paid' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
expenseSchema.index({ businessId: 1, expenseNo: 1 }, { unique: true });

// TDS Section Master
const tdsSectionSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  section: { type: String, required: true, trim: true }, // e.g. "194C", "194J", "194I"
  name: { type: String, required: true, trim: true }, // e.g. "Contractor Payments"
  rate: { type: Number, required: true }, // e.g. 1.0, 2.0, 10.0
  threshold: { type: Number, default: 30000 },
  deducteeType: { type: String, enum: ['company', 'non_company', 'both'], default: 'both' },
  effectiveFrom: { type: Date, default: Date.now },
  effectiveTo: { type: Date },
  chartOfAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
tdsSectionSchema.index({ businessId: 1, section: 1 }, { unique: true });

// TDS Transaction
const tdsTransactionSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'TDSSection', required: true },
  sectionName: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  deducteeType: { type: String, enum: ['company', 'non_company'], default: 'non_company' },
  deducteeId: { type: mongoose.Schema.Types.ObjectId },
  deducteeName: { type: String, required: true },
  pan: { type: String, trim: true, uppercase: true },
  voucherType: { type: String, enum: ['expense', 'purchase_bill', 'journal'], required: true },
  voucherNo: { type: String, required: true },
  voucherId: { type: mongoose.Schema.Types.ObjectId, required: true },
  grossAmount: { type: Number, required: true },
  tdsRate: { type: Number, required: true },
  tdsAmount: { type: Number, required: true },
  status: { type: String, enum: ['deducted', 'deposited_to_govt'], default: 'deducted' },
  challanNo: { type: String },
  depositDate: { type: Date },
  bsrCode: { type: String }
}, { timestamps: true });
tdsTransactionSchema.index({ businessId: 1, sectionId: 1, date: -1 });

module.exports = {
  Payment: mongoose.model('Payment', paymentSchema),
  PaymentAllocation: mongoose.model('PaymentAllocation', paymentAllocationSchema),
  ExpenseCategory: mongoose.model('ExpenseCategory', expenseCategorySchema),
  Expense: mongoose.model('Expense', expenseSchema),
  TDSSection: mongoose.model('TDSSection', tdsSectionSchema),
  TDSTransaction: mongoose.model('TDSTransaction', tdsTransactionSchema)
};
