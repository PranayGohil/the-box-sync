const express = require('express');
const router = express.Router();
const {
  createBusiness,
  getBusinessProfile,
  updateBusinessProfile,
  getMembers,
  addMember,
  createBranch,
  createWarehouse
} = require('../controllers/businessController');
const { protect } = require('../middleware/auth');
const { tenantContext } = require('../middleware/tenant');
const { requirePermission } = require('../middleware/rbac');

router.use(protect);

router.post('/', createBusiness);
router.get('/profile', tenantContext, getBusinessProfile);
router.put('/profile', tenantContext, requirePermission('settings', 'edit'), updateBusinessProfile);
router.get('/members', tenantContext, getMembers);
router.post('/members', tenantContext, requirePermission('settings', 'create'), addMember);
router.post('/branches', tenantContext, requirePermission('settings', 'create'), createBranch);
router.get('/warehouses', tenantContext, async (req, res, next) => {
  try {
    const { Warehouse } = require('../models');
    const warehouses = await Warehouse.find({ businessId: req.businessId, isActive: true });
    res.status(200).json({ success: true, data: warehouses });
  } catch (err) {
    next(err);
  }
});
router.post('/warehouses', tenantContext, requirePermission('warehouses', 'create'), createWarehouse);

module.exports = router;
