const express = require('express');
const router = express.Router();
const {
  getChartOfAccounts,
  createAccount,
  getTrialBalance,
  getProfitLoss,
  getBalanceSheet,
  getDayBook,
  getAccountLedger,
  createJournalVoucher,
  getBankAccounts,
  createBankAccount,
  getCashAccounts
} = require('../controllers/accountingController');
const { protect } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenant');
const { requirePermission, checkFinancialYearLock } = require('../middleware/rbac');

router.use(protect);
router.use(tenantContext);

router.get('/chart-of-accounts', requirePermission('accounting', 'view'), getChartOfAccounts);
router.post('/chart-of-accounts', requirePermission('accounting', 'create'), createAccount);

router.get('/trial-balance', requirePermission('accounting', 'view'), getTrialBalance);
router.get('/profit-loss', requirePermission('accounting', 'view'), getProfitLoss);
router.get('/balance-sheet', requirePermission('accounting', 'view'), getBalanceSheet);
router.get('/day-book', requirePermission('accounting', 'view'), getDayBook);
router.get('/ledger/:accountId', requirePermission('accounting', 'view'), getAccountLedger);
router.post('/journal-vouchers', requirePermission('accounting', 'create'), checkFinancialYearLock, createJournalVoucher);

router.get('/bank-accounts', getBankAccounts);
router.post('/bank-accounts', requirePermission('accounting', 'create'), createBankAccount);
router.get('/cash-accounts', getCashAccounts);

module.exports = router;
