const {
  ChartOfAccount,
  AccountGroup,
  JournalEntry,
  JournalEntryLine,
  Voucher,
  BankAccount,
  BankTransaction,
  CashAccount,
  CashTransaction
} = require('../models');
const AccountingService = require('../services/AccountingService');
const SequenceService = require('../services/SequenceService');

// --- CHART OF ACCOUNTS ---

exports.getChartOfAccounts = async (req, res, next) => {
  try {
    let accounts = await ChartOfAccount.find({ businessId: req.businessId }).populate('groupId');
    if (accounts.length === 0) {
      await AccountingService.seedDefaultChartOfAccounts(req.businessId);
      accounts = await ChartOfAccount.find({ businessId: req.businessId }).populate('groupId');
    }
    const groups = await AccountGroup.find({ businessId: req.businessId });

    res.status(200).json({
      success: true,
      data: {
        accounts,
        groups
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.createAccount = async (req, res, next) => {
  try {
    const account = await ChartOfAccount.create({
      ...req.body,
      businessId: req.businessId
    });
    res.status(201).json({ success: true, message: 'Account created', data: account });
  } catch (error) {
    next(error);
  }
};

// --- FINANCIAL STATEMENTS & REPORTS ---

// @desc    Get Live Trial Balance
// @route   GET /api/accounting/trial-balance
exports.getTrialBalance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const trialBalance = await AccountingService.getTrialBalance(req.businessId, startDate, endDate);
    res.status(200).json({ success: true, data: trialBalance });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Profit and Loss Statement
// @route   GET /api/accounting/profit-loss
exports.getProfitLoss = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const pnl = await AccountingService.getProfitAndLoss(req.businessId, startDate, endDate);
    res.status(200).json({ success: true, data: pnl });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Balance Sheet
// @route   GET /api/accounting/balance-sheet
exports.getBalanceSheet = async (req, res, next) => {
  try {
    const { asOfDate } = req.query;
    const balanceSheet = await AccountingService.getBalanceSheet(req.businessId, asOfDate);
    res.status(200).json({ success: true, data: balanceSheet });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Day Book (All Journal & Voucher entries for a date)
// @route   GET /api/accounting/day-book
exports.getDayBook = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const start = new Date(targetDate.setHours(0, 0, 0, 0));
    const end = new Date(targetDate.setHours(23, 59, 59, 999));

    const entries = await JournalEntry.find({
      businessId: req.businessId,
      date: { $gte: start, $lte: end }
    }).populate('createdBy', 'name');

    const entryIds = entries.map(e => e._id);
    const lines = await JournalEntryLine.find({ journalEntryId: { $in: entryIds } }).populate('accountId', 'name accountCode');

    // Group lines by journalEntryId
    const linesByEntry = lines.reduce((acc, line) => {
      acc[line.journalEntryId] = acc[line.journalEntryId] || [];
      acc[line.journalEntryId].push(line);
      return acc;
    }, {});

    const dayBookEntries = entries.map(e => ({
      ...e.toObject(),
      lines: linesByEntry[e._id] || []
    }));

    const totalDebit = dayBookEntries.reduce((s, e) => s + e.totalDebit, 0);
    const totalCredit = dayBookEntries.reduce((s, e) => s + e.totalCredit, 0);

    res.status(200).json({
      success: true,
      data: {
        entries: dayBookEntries,
        totalDebit: Number(totalDebit.toFixed(2)),
        totalCredit: Number(totalCredit.toFixed(2))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get General Ledger for a specific account
// @route   GET /api/accounting/ledger/:accountId
exports.getAccountLedger = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;

    const account = await ChartOfAccount.findOne({ _id: accountId, businessId: req.businessId }).populate('groupId');
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    const query = { businessId: req.businessId, accountId: account._id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const lines = await JournalEntryLine.find(query).sort({ date: 1 }).populate('journalEntryId', 'entryNo voucherType voucherNo narration');

    let runningBalance = account.openingBalance || 0;
    const isAssetOrExpense = ['Asset', 'Expense'].includes(account.groupId?.nature);

    const statement = lines.map(line => {
      const deb = line.debit || 0;
      const cred = line.credit || 0;
      if (isAssetOrExpense) {
        runningBalance += (deb - cred);
      } else {
        runningBalance += (cred - deb);
      }

      return {
        _id: line._id,
        date: line.date,
        voucherType: line.journalEntryId?.voucherType,
        voucherNo: line.journalEntryId?.voucherNo,
        entryNo: line.journalEntryId?.entryNo,
        narration: line.narration,
        debit: deb,
        credit: cred,
        runningBalance: Number(runningBalance.toFixed(2))
      };
    });

    res.status(200).json({
      success: true,
      data: {
        account,
        statement,
        closingBalance: Number(runningBalance.toFixed(2))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Manual Journal Voucher
// @route   POST /api/accounting/journal-vouchers
exports.createJournalVoucher = async (req, res, next) => {
  try {
    const { narration, lines } = req.body;
    if (!lines || lines.length < 2) {
      return res.status(400).json({ success: false, message: 'Journal voucher must have at least 2 balanced lines' });
    }

    const entry = await AccountingService.postJournalEntry({
      businessId: req.businessId,
      branchId: req.body.branchId || null,
      financialYear: req.financialYear,
      voucherType: 'journal',
      voucherNo: `JV-${Date.now()}`,
      referenceId: null,
      referenceModel: 'Manual',
      narration: narration || 'Manual Journal Entry',
      lines,
      userId: req.user._id
    });

    res.status(201).json({ success: true, message: 'Journal voucher posted successfully', data: entry });
  } catch (error) {
    next(error);
  }
};

// --- BANK & CASH ACCOUNTS ---

exports.getBankAccounts = async (req, res, next) => {
  try {
    const accounts = await BankAccount.find({ businessId: req.businessId, isActive: true });
    res.status(200).json({ success: true, data: accounts });
  } catch (error) {
    next(error);
  }
};

exports.createBankAccount = async (req, res, next) => {
  try {
    const bankAccount = await BankAccount.create({
      ...req.body,
      businessId: req.businessId,
      currentBalance: req.body.openingBalance || 0
    });
    res.status(201).json({ success: true, data: bankAccount });
  } catch (error) {
    next(error);
  }
};

exports.getCashAccounts = async (req, res, next) => {
  try {
    let accounts = await CashAccount.find({ businessId: req.businessId, isActive: true });
    if (accounts.length === 0) {
      const defaultCash = await CashAccount.create({
        businessId: req.businessId,
        name: 'Main Cash Drawer',
        isDefault: true
      });
      accounts = [defaultCash];
    }
    res.status(200).json({ success: true, data: accounts });
  } catch (error) {
    next(error);
  }
};
