const {
  AccountGroup,
  ChartOfAccount,
  JournalEntry,
  JournalEntryLine,
  Voucher,
  Customer,
  Supplier,
  BankAccount,
  CashAccount
} = require('../models');
const { DEFAULT_ACCOUNT_GROUPS } = require('../config/constants');

class AccountingService {
  /**
   * Seed standard Chart of Accounts for a newly created business
   */
  static async seedDefaultChartOfAccounts(businessId) {
    // 1. Create Default Account Groups
    const groupMap = {};
    for (const group of DEFAULT_ACCOUNT_GROUPS) {
      let parentGroupId = null;
      if (group.parentCode && groupMap[group.parentCode]) {
        parentGroupId = groupMap[group.parentCode]._id;
      }

      let existing = await AccountGroup.findOne({ businessId, name: group.name });
      if (!existing) {
        existing = await AccountGroup.create({
          businessId,
          name: group.name,
          code: group.code,
          nature: group.nature,
          parentGroupId,
          isSystem: true
        });
      }
      groupMap[group.code] = existing;
    }

    // 2. Create Default Standard Accounts
    const defaultAccounts = [
      { code: '1001', name: 'Cash in Hand', groupCode: 'CASH', type: 'cash' },
      { code: '1002', name: 'Main Bank Account', groupCode: 'BANK', type: 'bank' },
      { code: '1003', name: 'Accounts Receivable (Debtors)', groupCode: 'DEBTORS', type: 'customer' },
      { code: '1004', name: 'Stock in Hand / Inventory Asset', groupCode: 'STOCK', type: 'stock_in_hand' },
      { code: '1005', name: 'Input CGST', groupCode: 'INPUT_GST', type: 'gst_cgst_input' },
      { code: '1006', name: 'Input SGST', groupCode: 'INPUT_GST', type: 'gst_sgst_input' },
      { code: '1007', name: 'Input IGST', groupCode: 'INPUT_GST', type: 'gst_igst_input' },

      { code: '2001', name: 'Accounts Payable (Creditors)', groupCode: 'CREDITORS', type: 'supplier' },
      { code: '2002', name: 'Output CGST Payable', groupCode: 'OUTPUT_GST', type: 'gst_cgst_output' },
      { code: '2003', name: 'Output SGST Payable', groupCode: 'OUTPUT_GST', type: 'gst_sgst_output' },
      { code: '2004', name: 'Output IGST Payable', groupCode: 'OUTPUT_GST', type: 'gst_igst_output' },
      { code: '2005', name: 'TDS Payable Account', groupCode: 'TDS_PAY', type: 'tds_payable' },

      { code: '3001', name: 'Sales Revenue Account', groupCode: 'SALES_INC', type: 'sales' },
      { code: '3002', name: 'Sales Returns & Allowances', groupCode: 'SALES_INC', type: 'sales_return' },
      { code: '3003', name: 'Discount Allowed', groupCode: 'IND_EXP', type: 'discount_allowed' },

      { code: '4001', name: 'Purchase Account', groupCode: 'PURCHASE_ACC', type: 'purchase' },
      { code: '4002', name: 'Purchase Returns', groupCode: 'PURCHASE_ACC', type: 'purchase_return' },
      { code: '4003', name: 'Discount Received', groupCode: 'IND_INC', type: 'discount_received' },
      { code: '4004', name: 'General Office Expenses', groupCode: 'IND_EXP', type: 'expense' },
      { code: '4005', name: 'Rent Expense', groupCode: 'IND_EXP', type: 'expense' },
      { code: '4006', name: 'Salaries & Wages', groupCode: 'IND_EXP', type: 'expense' },

      { code: '5001', name: "Owner's Capital Account", groupCode: 'CAPITAL', type: 'capital' }
    ];

    for (const acc of defaultAccounts) {
      const group = groupMap[acc.groupCode];
      if (!group) continue;

      const existingAcc = await ChartOfAccount.findOne({ businessId, accountCode: acc.code });
      if (!existingAcc) {
        await ChartOfAccount.create({
          businessId,
          accountCode: acc.code,
          name: acc.name,
          groupId: group._id,
          type: acc.type,
          isSystem: true
        });
      }
    }
  }

  /**
   * Helper: Get standard account by type
   */
  static async getAccountByType(businessId, type) {
    let account = await ChartOfAccount.findOne({ businessId, type });
    if (!account) {
      await AccountingService.seedDefaultChartOfAccounts(businessId);
      account = await ChartOfAccount.findOne({ businessId, type });
    }
    return account;
  }

  /**
   * Post Double-Entry Journal Entry
   * @param {Object} entryData - { businessId, branchId, financialYear, voucherType, voucherNo, referenceId, referenceModel, narration, lines, userId }
   */
  static async postJournalEntry({
    businessId,
    branchId = null,
    financialYear,
    voucherType,
    voucherNo,
    referenceId,
    referenceModel,
    narration = '',
    lines = [],
    userId
  }) {
    if (!lines || lines.length === 0) {
      throw new Error('Journal Entry must contain at least two transaction lines');
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      const deb = Number(line.debit) || 0;
      const cred = Number(line.credit) || 0;
      totalDebit += deb;
      totalCredit += cred;
    }

    totalDebit = Number(totalDebit.toFixed(2));
    totalCredit = Number(totalCredit.toFixed(2));

    // Double-Entry Invariant: Total Debit == Total Credit
    const diff = Math.abs(totalDebit - totalCredit);
    if (diff > 0.05) {
      throw new Error(`Double-Entry accounting imbalance: Total Debit (₹${totalDebit}) != Total Credit (₹${totalCredit})`);
    }

    const SequenceService = require('./SequenceService');
    const entryNo = await SequenceService.getNextDocumentNumber(businessId, 'journal', financialYear);

    const journalEntry = await JournalEntry.create({
      businessId,
      branchId,
      financialYear,
      entryNo,
      date: new Date(),
      voucherType,
      voucherNo,
      referenceId,
      referenceModel,
      narration,
      totalDebit,
      totalCredit,
      createdBy: userId
    });

    for (const line of lines) {
      const deb = Number(Number(line.debit || 0).toFixed(2));
      const cred = Number(Number(line.credit || 0).toFixed(2));

      await JournalEntryLine.create({
        journalEntryId: journalEntry._id,
        businessId,
        accountId: line.accountId,
        partyType: line.partyType || 'none',
        partyId: line.partyId || null,
        debit: deb,
        credit: cred,
        narration: line.narration || narration,
        date: new Date()
      });

      // Update Chart of Account cached balance
      const account = await ChartOfAccount.findById(line.accountId).populate('groupId');
      if (account) {
        const isAssetOrExpense = ['Asset', 'Expense'].includes(account.groupId?.nature);
        const change = isAssetOrExpense ? deb - cred : cred - deb;
        account.currentBalance = (account.currentBalance || 0) + change;
        await account.save();
      }

      // Update Customer or Supplier cached balances
      if (line.partyType === 'customer' && line.partyId) {
        await Customer.findByIdAndUpdate(line.partyId, {
          $inc: { currentBalance: deb - cred }
        });
      } else if (line.partyType === 'supplier' && line.partyId) {
        await Supplier.findByIdAndUpdate(line.partyId, {
          $inc: { currentBalance: cred - deb }
        });
      }
    }

    return journalEntry;
  }

  /**
   * Post Sales Invoice into Double-Entry Ledgers
   */
  static async postSalesInvoice(invoice, userId) {
    const debtorsAcc = await AccountingService.getAccountByType(invoice.businessId, 'customer');
    const salesAcc = await AccountingService.getAccountByType(invoice.businessId, 'sales');
    const cgstOutputAcc = await AccountingService.getAccountByType(invoice.businessId, 'gst_cgst_output');
    const sgstOutputAcc = await AccountingService.getAccountByType(invoice.businessId, 'gst_sgst_output');
    const igstOutputAcc = await AccountingService.getAccountByType(invoice.businessId, 'gst_igst_output');

    const lines = [
      {
        accountId: debtorsAcc._id,
        partyType: 'customer',
        partyId: invoice.customerId,
        debit: invoice.grandTotal,
        credit: 0,
        narration: `Invoice #${invoice.invoiceNo} to ${invoice.customerNameSnapshot}`
      },
      {
        accountId: salesAcc._id,
        debit: 0,
        credit: invoice.taxableAmount,
        narration: `Sales Revenue from Invoice #${invoice.invoiceNo}`
      }
    ];

    if (invoice.cgstTotal > 0 && cgstOutputAcc) {
      lines.push({
        accountId: cgstOutputAcc._id,
        debit: 0,
        credit: invoice.cgstTotal,
        narration: `Output CGST on #${invoice.invoiceNo}`
      });
    }

    if (invoice.sgstTotal > 0 && sgstOutputAcc) {
      lines.push({
        accountId: sgstOutputAcc._id,
        debit: 0,
        credit: invoice.sgstTotal,
        narration: `Output SGST on #${invoice.invoiceNo}`
      });
    }

    if (invoice.igstTotal > 0 && igstOutputAcc) {
      lines.push({
        accountId: igstOutputAcc._id,
        debit: 0,
        credit: invoice.igstTotal,
        narration: `Output IGST on #${invoice.invoiceNo}`
      });
    }

    // Handle round-off
    if (invoice.roundOff !== 0) {
      const discountAcc = await AccountingService.getAccountByType(invoice.businessId, 'discount_allowed');
      if (discountAcc) {
        if (invoice.roundOff > 0) {
          lines.push({ accountId: discountAcc._id, debit: 0, credit: invoice.roundOff, narration: 'Round Off' });
        } else {
          lines.push({ accountId: discountAcc._id, debit: Math.abs(invoice.roundOff), credit: 0, narration: 'Round Off' });
        }
      }
    }

    return AccountingService.postJournalEntry({
      businessId: invoice.businessId,
      branchId: invoice.branchId,
      financialYear: invoice.financialYear,
      voucherType: 'sales',
      voucherNo: invoice.invoiceNo,
      referenceId: invoice._id,
      referenceModel: 'Invoice',
      narration: `GST Sales Tax Invoice #${invoice.invoiceNo}`,
      lines,
      userId
    });
  }

  /**
   * Post Purchase Bill into Double-Entry Ledgers
   */
  static async postPurchaseBill(bill, userId) {
    const creditorsAcc = await AccountingService.getAccountByType(bill.businessId, 'supplier');
    const purchaseAcc = await AccountingService.getAccountByType(bill.businessId, 'purchase');
    const cgstInputAcc = await AccountingService.getAccountByType(bill.businessId, 'gst_cgst_input');
    const sgstInputAcc = await AccountingService.getAccountByType(bill.businessId, 'gst_sgst_input');
    const igstInputAcc = await AccountingService.getAccountByType(bill.businessId, 'gst_igst_input');

    const lines = [
      {
        accountId: purchaseAcc._id,
        debit: bill.taxableAmount,
        credit: 0,
        narration: `Purchase from ${bill.supplierNameSnapshot} (Bill #${bill.billNo})`
      }
    ];

    if (bill.cgstTotal > 0 && cgstInputAcc) {
      lines.push({ accountId: cgstInputAcc._id, debit: bill.cgstTotal, credit: 0, narration: `Input CGST on Bill #${bill.billNo}` });
    }
    if (bill.sgstTotal > 0 && sgstInputAcc) {
      lines.push({ accountId: sgstInputAcc._id, debit: bill.sgstTotal, credit: 0, narration: `Input SGST on Bill #${bill.billNo}` });
    }
    if (bill.igstTotal > 0 && igstInputAcc) {
      lines.push({ accountId: igstInputAcc._id, debit: bill.igstTotal, credit: 0, narration: `Input IGST on Bill #${bill.billNo}` });
    }

    lines.push({
      accountId: creditorsAcc._id,
      partyType: 'supplier',
      partyId: bill.supplierId,
      debit: 0,
      credit: bill.grandTotal,
      narration: `Payable to ${bill.supplierNameSnapshot} for Bill #${bill.billNo}`
    });

    return AccountingService.postJournalEntry({
      businessId: bill.businessId,
      branchId: bill.branchId,
      financialYear: bill.financialYear,
      voucherType: 'purchase',
      voucherNo: bill.billNo,
      referenceId: bill._id,
      referenceModel: 'PurchaseBill',
      narration: `Purchase Bill #${bill.billNo}`,
      lines,
      userId
    });
  }

  /**
   * Post Payment (In or Out) into Double-Entry Ledgers
   */
  static async postPayment(payment, userId) {
    let paymentAcc;
    if (payment.paymentMode === 'cash') {
      paymentAcc = await AccountingService.getAccountByType(payment.businessId, 'cash');
    } else {
      paymentAcc = await AccountingService.getAccountByType(payment.businessId, 'bank');
    }

    const isPaymentIn = payment.paymentType === 'in';
    const lines = [];

    if (isPaymentIn) {
      // Debit Cash/Bank, Credit Customer (Debtor)
      const debtorAcc = await AccountingService.getAccountByType(payment.businessId, 'customer');
      lines.push({
        accountId: paymentAcc._id,
        debit: payment.amount,
        credit: 0,
        narration: `Payment received via ${payment.paymentMode.toUpperCase()} (Ref: ${payment.referenceNo || 'None'})`
      });
      lines.push({
        accountId: debtorAcc._id,
        partyType: 'customer',
        partyId: payment.partyId,
        debit: 0,
        credit: payment.amount,
        narration: `Payment receipt #${payment.paymentNo} from ${payment.partyNameSnapshot}`
      });
    } else {
      // Debit Supplier (Creditor), Credit Cash/Bank
      const creditorAcc = await AccountingService.getAccountByType(payment.businessId, 'supplier');
      lines.push({
        accountId: creditorAcc._id,
        partyType: 'supplier',
        partyId: payment.partyId,
        debit: payment.amount,
        credit: 0,
        narration: `Payment to ${payment.partyNameSnapshot} (Vch #${payment.paymentNo})`
      });
      lines.push({
        accountId: paymentAcc._id,
        debit: 0,
        credit: payment.amount,
        narration: `Payment paid via ${payment.paymentMode.toUpperCase()} (Ref: ${payment.referenceNo || 'None'})`
      });
    }

    return AccountingService.postJournalEntry({
      businessId: payment.businessId,
      branchId: payment.branchId,
      financialYear: '2026-27',
      voucherType: isPaymentIn ? 'receipt' : 'payment',
      voucherNo: payment.paymentNo,
      referenceId: payment._id,
      referenceModel: 'Payment',
      narration: `Payment ${isPaymentIn ? 'Receipt' : 'Voucher'} #${payment.paymentNo}`,
      lines,
      userId
    });
  }

  /**
   * Post Expense into Double-Entry Ledgers with TDS deduction
   */
  static async postExpense(expense, userId) {
    const expenseAcc = expense.chartOfAccountId
      ? await ChartOfAccount.findById(expense.chartOfAccountId)
      : await AccountingService.getAccountByType(expense.businessId, 'expense');

    let paymentAcc;
    if (expense.paymentMode === 'cash') {
      paymentAcc = await AccountingService.getAccountByType(expense.businessId, 'cash');
    } else {
      paymentAcc = await AccountingService.getAccountByType(expense.businessId, 'bank');
    }

    const lines = [
      {
        accountId: expenseAcc._id,
        debit: expense.amount,
        credit: 0,
        narration: `Expense: ${expense.categoryName} (${expense.vendorName || 'General'})`
      }
    ];

    if (expense.tdsAmount > 0) {
      const tdsPayableAcc = await AccountingService.getAccountByType(expense.businessId, 'tds_payable');
      lines.push({
        accountId: tdsPayableAcc._id,
        debit: 0,
        credit: expense.tdsAmount,
        narration: `TDS deducted on ${expense.categoryName}`
      });
    }

    lines.push({
      accountId: paymentAcc._id,
      debit: 0,
      credit: expense.netPayable,
      narration: `Paid via ${expense.paymentMode.toUpperCase()} for ${expense.categoryName}`
    });

    return AccountingService.postJournalEntry({
      businessId: expense.businessId,
      branchId: expense.branchId,
      financialYear: '2026-27',
      voucherType: 'expense',
      voucherNo: expense.expenseNo,
      referenceId: expense._id,
      referenceModel: 'Expense',
      narration: `Expense #${expense.expenseNo} - ${expense.categoryName}`,
      lines,
      userId
    });
  }

  /**
   * Generate Live Trial Balance
   */
  static async getTrialBalance(businessId, fromDate = null, toDate = null) {
    const accounts = await ChartOfAccount.find({ businessId, isActive: true }).populate('groupId');

    const trialBalanceRows = [];
    let grandTotalDebit = 0;
    let grandTotalCredit = 0;

    for (const acc of accounts) {
      const dateFilter = {};
      if (fromDate) dateFilter.$gte = new Date(fromDate);
      if (toDate) dateFilter.$lte = new Date(toDate);

      const matchQuery = { businessId, accountId: acc._id };
      if (fromDate || toDate) matchQuery.date = dateFilter;

      const lines = await JournalEntryLine.find(matchQuery);
      const totalDeb = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
      const totalCred = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

      const isAssetOrExpense = ['Asset', 'Expense'].includes(acc.groupId?.nature);
      const closingNet = totalDeb - totalCred;

      let netDebit = 0;
      let netCredit = 0;

      if (isAssetOrExpense) {
        if (closingNet >= 0) netDebit = closingNet;
        else netCredit = Math.abs(closingNet);
      } else {
        if (totalCred - totalDeb >= 0) netCredit = totalCred - totalDeb;
        else netDebit = Math.abs(totalCred - totalDeb);
      }

      if (netDebit > 0 || netCredit > 0) {
        trialBalanceRows.push({
          accountId: acc._id,
          accountCode: acc.accountCode,
          accountName: acc.name,
          groupName: acc.groupId?.name || 'General',
          nature: acc.groupId?.nature || 'Asset',
          debit: Number(netDebit.toFixed(2)),
          credit: Number(netCredit.toFixed(2))
        });
        grandTotalDebit += netDebit;
        grandTotalCredit += netCredit;
      }
    }

    return {
      rows: trialBalanceRows,
      grandTotalDebit: Number(grandTotalDebit.toFixed(2)),
      grandTotalCredit: Number(grandTotalCredit.toFixed(2)),
      isBalanced: Math.abs(grandTotalDebit - grandTotalCredit) < 0.05
    };
  }

  /**
   * Generate Profit and Loss Statement
   */
  static async getProfitAndLoss(businessId, fromDate = null, toDate = null) {
    const trialBalance = await AccountingService.getTrialBalance(businessId, fromDate, toDate);

    const incomes = trialBalance.rows.filter(r => r.nature === 'Income');
    const expenses = trialBalance.rows.filter(r => r.nature === 'Expense');

    const totalIncome = incomes.reduce((sum, r) => sum + r.credit, 0);
    const totalExpenses = expenses.reduce((sum, r) => sum + r.debit, 0);
    const netProfit = totalIncome - totalExpenses;

    return {
      incomes,
      expenses,
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      isProfitable: netProfit >= 0
    };
  }

  /**
   * Generate Balance Sheet Statement
   */
  static async getBalanceSheet(businessId, asOfDate = null) {
    const trialBalance = await AccountingService.getTrialBalance(businessId, null, asOfDate);
    const pnl = await AccountingService.getProfitAndLoss(businessId, null, asOfDate);

    const assets = trialBalance.rows.filter(r => r.nature === 'Asset');
    const liabilities = trialBalance.rows.filter(r => r.nature === 'Liability');
    const equities = trialBalance.rows.filter(r => r.nature === 'Equity');

    const totalAssets = assets.reduce((sum, r) => sum + r.debit, 0);
    const totalLiabilities = liabilities.reduce((sum, r) => sum + r.credit, 0);
    const totalEquity = equities.reduce((sum, r) => sum + r.credit, 0) + pnl.netProfit;

    return {
      assets,
      liabilities,
      equity: {
        accounts: equities,
        retainedEarnings: pnl.netProfit,
        totalEquity: Number(totalEquity.toFixed(2))
      },
      totalAssets: Number(totalAssets.toFixed(2)),
      totalLiabilitiesAndEquity: Number((totalLiabilities + totalEquity).toFixed(2)),
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1.0
    };
  }
}

module.exports = AccountingService;
