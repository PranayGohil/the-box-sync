const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} = require('../controllers/supplierController');
const { protect } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenant');
const { requirePermission } = require('../middleware/rbac');

router.use(protect);
router.use(tenantContext);

router.get('/', requirePermission('suppliers', 'view'), getSuppliers);
router.get('/:id', requirePermission('suppliers', 'view'), getSupplierById);
router.post('/', requirePermission('suppliers', 'create'), createSupplier);
router.put('/:id', requirePermission('suppliers', 'edit'), updateSupplier);
router.delete('/:id', requirePermission('suppliers', 'delete'), deleteSupplier);

module.exports = router;
