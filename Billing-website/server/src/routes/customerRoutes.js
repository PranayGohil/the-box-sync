const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');
const { protect } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenant');
const { requirePermission } = require('../middleware/rbac');

router.use(protect);
router.use(tenantContext);

router.get('/', requirePermission('customers', 'view'), getCustomers);
router.get('/:id', requirePermission('customers', 'view'), getCustomerById);
router.post('/', requirePermission('customers', 'create'), createCustomer);
router.put('/:id', requirePermission('customers', 'edit'), updateCustomer);
router.delete('/:id', requirePermission('customers', 'delete'), deleteCustomer);

module.exports = router;
