const express = require('express');
const router = express.Router();
const {
  getPayments,
  createPayment,
  getExpenses,
  createExpense,
  getExpenseCategories,
  createExpenseCategory
} = require('../controllers/paymentAndExpenseController');
const { protect } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenant');
const { requirePermission, checkFinancialYearLock } = require('../middleware/rbac');

router.use(protect);
router.use(tenantContext);

// Payments (In & Out)
router.get('/', requirePermission('payments', 'view'), getPayments);
router.post('/', requirePermission('payments', 'create'), checkFinancialYearLock, createPayment);

// Expenses
router.get('/expenses', requirePermission('expenses', 'view'), getExpenses);
router.post('/expenses', requirePermission('expenses', 'create'), checkFinancialYearLock, createExpense);
router.get('/expenses/categories', getExpenseCategories);
router.post('/expenses/categories', requirePermission('expenses', 'create'), createExpenseCategory);

module.exports = router;
