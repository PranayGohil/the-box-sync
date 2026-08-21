const {
  Payment,
  PaymentAllocation,
  Invoice,
  PurchaseBill,
  Customer,
  Supplier,
  Expense,
  ExpenseCategory,
  TDSSection,
  TDSTransaction
} = require('../models');
const SequenceService = require('../services/SequenceService');
const AccountingService = require('../services/AccountingService');
const TaxDeterminationService = require('../services/TaxDeterminationService');

// --- PAYMENTS (IN & OUT) ---

// @desc    Get all payments with search & filters
// @route   GET /api/payments
exports.getPayments = async (req, res, next) => {
  try {
    const { paymentType, partyId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = { businessId: req.businessId };

    if (paymentType) query.paymentType = paymentType;
    if (partyId) query.partyId = partyId;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: payments,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Payment In (Customer Receipt) or Payment Out (Supplier Payment) with Multi-Invoice Allocation
// @route   POST /api/payments
exports.createPayment = async (req, res, next) => {
  try {
    const {
      paymentType, // 'in' or 'out'
      partyId,
      amount,
      paymentMode = 'cash',
      referenceNo,
      bankAccountId,
      cashAccountId,
      chequeNo,
      chequeDate,
      allocations = [], // [{ documentId, documentType: 'invoice'|'purchase_bill', amount }]
      notes
    } = req.body;

    if (!paymentType || !partyId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Payment type, party and a positive amount are required' });
    }

    let partyName = 'Party';
    if (paymentType === 'in') {
      const customer = await Customer.findOne({ _id: partyId, businessId: req.businessId });
      if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
      partyName = customer.name;
    } else {
      const supplier = await Supplier.findOne({ _id: partyId, businessId: req.businessId });
      if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
      partyName = supplier.name;
    }

    const seqDocType = paymentType === 'in' ? 'payment_in' : 'payment_out';
    const paymentNo = await SequenceService.getNextDocumentNumber(req.businessId, seqDocType, req.financialYear);

    const paymentAmount = Number(amount);
    let allocatedTotal = 0;

    const payment = await Payment.create({
      businessId: req.businessId,
      branchId: req.body.branchId || null,
      paymentNo,
      paymentType,
      partyType: paymentType === 'in' ? 'customer' : 'supplier',
      partyId,
      partyNameSnapshot: partyName,
      date: req.body.date || new Date(),
      amount: paymentAmount,
      unallocatedAmount: paymentAmount,
      paymentMode,
      referenceNo,
      bankAccountId,
      cashAccountId,
      chequeNo,
      chequeDate,
      notes,
      status: 'completed',
      createdBy: req.user._id
    });

    // Process Allocations to Invoices or Purchase Bills
    for (const alloc of allocations) {
      const allocAmt = Number(alloc.amount);
      if (allocAmt <= 0) continue;

      if (alloc.documentType === 'invoice' || paymentType === 'in') {
        const invoice = await Invoice.findOne({ _id: alloc.documentId, businessId: req.businessId });
        if (invoice) {
          const applied = Math.min(allocAmt, invoice.balanceAmount);
          invoice.paidAmount += applied;
          invoice.balanceAmount = Math.max(0, invoice.grandTotal - invoice.paidAmount);
          invoice.paymentStatus = invoice.balanceAmount === 0 ? 'paid' : 'partially_paid';
          await invoice.save();

          await PaymentAllocation.create({
            businessId: req.businessId,
            paymentId: payment._id,
            documentType: 'invoice',
            documentId: invoice._id,
            documentNo: invoice.invoiceNo,
            allocatedAmount: applied
          });
          allocatedTotal += applied;
        }
      } else if (alloc.documentType === 'purchase_bill' || paymentType === 'out') {
        const bill = await PurchaseBill.findOne({ _id: alloc.documentId, businessId: req.businessId });
        if (bill) {
          const applied = Math.min(allocAmt, bill.balanceAmount);
          bill.paidAmount += applied;
          bill.balanceAmount = Math.max(0, bill.grandTotal - bill.paidAmount);
          bill.paymentStatus = bill.balanceAmount === 0 ? 'paid' : 'partially_paid';
          await bill.save();

          await PaymentAllocation.create({
            businessId: req.businessId,
            paymentId: payment._id,
            documentType: 'purchase_bill',
            documentId: bill._id,
            documentNo: bill.billNo,
            allocatedAmount: applied
          });
          allocatedTotal += applied;
        }
      }
    }

    payment.unallocatedAmount = Math.max(0, paymentAmount - allocatedTotal);
    await payment.save();

    // Post to Double-Entry Accounting
    const journalEntry = await AccountingService.postPayment(payment, req.user._id);
    payment.journalEntryId = journalEntry._id;
    await payment.save();

    res.status(201).json({
      success: true,
      message: `Payment ${paymentType === 'in' ? 'Receipt' : 'Voucher'} #${paymentNo} created successfully`,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// --- EXPENSES & CATEGORIES ---

// @desc    Get all expenses
// @route   GET /api/expenses
exports.getExpenses = async (req, res, next) => {
  try {
    const { categoryId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = { businessId: req.businessId };

    if (categoryId) query.categoryId = categoryId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .populate('categoryId', 'name')
      .populate('chartOfAccountId', 'name accountCode')
      .populate('tdsSectionId', 'section rate')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: expenses,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new Expense with TDS deduction & Double-Entry posting
// @route   POST /api/expenses
exports.createExpense = async (req, res, next) => {
  try {
    const {
      categoryId,
      categoryName,
      vendorName,
      vendorGSTIN,
      amount,
      taxRate = 0,
      tdsSectionId,
      paymentMode = 'cash',
      referenceNo,
      notes
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Expense amount is required' });
    }

    const expenseNo = await SequenceService.getNextDocumentNumber(req.businessId, 'expense', req.financialYear);
    const grossAmount = Number(amount);

    let tdsRate = 0;
    let tdsAmount = 0;
    let selectedTDSSection = null;

    if (tdsSectionId) {
      selectedTDSSection = await TDSSection.findOne({ _id: tdsSectionId, businessId: req.businessId });
      if (selectedTDSSection) {
        tdsRate = selectedTDSSection.rate;
        const tdsResult = TaxDeterminationService.calculateTDS(grossAmount, tdsRate);
        tdsAmount = tdsResult.tdsAmount;
      }
    }

    const taxAmount = taxRate > 0 ? Number(((grossAmount * taxRate) / 100).toFixed(2)) : 0;
    const netPayable = grossAmount + taxAmount - tdsAmount;

    let catName = categoryName || 'General Expense';
    if (categoryId) {
      const cat = await ExpenseCategory.findOne({ _id: categoryId, businessId: req.businessId });
      if (cat) catName = cat.name;
    }

    const expense = await Expense.create({
      businessId: req.businessId,
      branchId: req.body.branchId || null,
      expenseNo,
      date: req.body.date || new Date(),
      categoryId,
      categoryName: catName,
      vendorName,
      vendorGSTIN,
      amount: grossAmount,
      taxRate,
      taxAmount,
      tdsSectionId,
      tdsRate,
      tdsAmount,
      netPayable,
      paymentMode,
      referenceNo,
      notes,
      status: 'paid',
      createdBy: req.user._id
    });

    // Record TDS Transaction if applicable
    if (tdsAmount > 0 && selectedTDSSection) {
      await TDSTransaction.create({
        businessId: req.businessId,
        sectionId: selectedTDSSection._id,
        sectionName: selectedTDSSection.name,
        date: new Date(),
        deducteeType: selectedTDSSection.deducteeType === 'company' ? 'company' : 'non_company',
        deducteeName: vendorName || 'Vendor',
        voucherType: 'expense',
        voucherNo: expenseNo,
        voucherId: expense._id,
        grossAmount,
        tdsRate,
        tdsAmount,
        status: 'deducted'
      });
    }

    // Post to Double-Entry Accounting
    const journalEntry = await AccountingService.postExpense(expense, req.user._id);
    expense.journalEntryId = journalEntry._id;
    await expense.save();

    res.status(201).json({
      success: true,
      message: `Expense #${expenseNo} recorded successfully`,
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expense categories
// @route   GET /api/expenses/categories
exports.getExpenseCategories = async (req, res, next) => {
  try {
    let categories = await ExpenseCategory.find({ businessId: req.businessId, isActive: true });
    if (categories.length === 0) {
      // Seed common expense categories
      const defaults = [
        'Office Rent',
        'Electricity & Utilities',
        'Staff Salary & Wages',
        'Internet & Telecom',
        'Printing & Stationery',
        'Travel & Conveyance',
        'Advertising & Marketing',
        'Repairs & Maintenance',
        'Legal & Professional Fees',
        'Miscellaneous Expenses'
      ];
      for (const name of defaults) {
        await ExpenseCategory.create({ businessId: req.businessId, name });
      }
      categories = await ExpenseCategory.find({ businessId: req.businessId, isActive: true });
    }
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

exports.createExpenseCategory = async (req, res, next) => {
  try {
    const category = await ExpenseCategory.create({ ...req.body, businessId: req.businessId });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};
