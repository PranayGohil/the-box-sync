const express = require('express');
const router = express.Router();
const {
  getStockSummary,
  getStockMovements,
  createStockAdjustment,
  createStockTransfer,
  getBatches
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenant');
const { requirePermission } = require('../middleware/rbac');

router.use(protect);
router.use(tenantContext);

router.get('/masters/warehouses', async (req, res, next) => {
  try {
    const { Warehouse } = require('../models');
    const warehouses = await Warehouse.find({ businessId: req.businessId, isActive: true });
    res.status(200).json({ success: true, data: warehouses });
  } catch (err) {
    next(err);
  }
});
router.get('/summary', requirePermission('inventory', 'view'), getStockSummary);
router.get('/movements', requirePermission('inventory', 'view'), getStockMovements);
router.get('/batches', requirePermission('inventory', 'view'), getBatches);
router.post('/adjustments', requirePermission('inventory', 'create'), createStockAdjustment);
router.post('/transfers', requirePermission('inventory', 'create'), createStockTransfer);

module.exports = router;
