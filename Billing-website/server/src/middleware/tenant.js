const { Business, BusinessMember, FinancialYear } = require('../models');

const tenantContext = async (req, res, next) => {
  try {
    const businessId = req.headers['x-business-id'] || req.query.businessId || req.body.businessId;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'X-Business-Id header or businessId parameter is required',
        errors: []
      });
    }

    // Verify tenant exists and user has membership in BusinessMember
    const member = await BusinessMember.findOne({
      businessId,
      userId: req.user._id,
      status: 'active'
    }).populate('businessId');

    if (!member || !member.businessId || member.businessId.isDeleted) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have active membership in this business organization',
        errors: []
      });
    }

    req.businessId = member.businessId._id;
    req.business = member.businessId;
    req.member = member;
    req.userRole = member.role;
    req.permissions = member.permissions || {};

    // Check branch and warehouse authorization if provided in request
    const requestedBranchId = req.headers['x-branch-id'] || req.query.branchId || req.body.branchId;
    if (requestedBranchId && !member.isAllBranches) {
      const hasBranchAccess = member.branchAccess.some(id => id.toString() === requestedBranchId.toString());
      if (!hasBranchAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have authorization for this branch',
          errors: []
        });
      }
    }

    const requestedWarehouseId = req.headers['x-warehouse-id'] || req.query.warehouseId || req.body.warehouseId;
    if (requestedWarehouseId && !member.isAllWarehouses) {
      const hasWarehouseAccess = member.warehouseAccess.some(id => id.toString() === requestedWarehouseId.toString());
      if (!hasWarehouseAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have authorization for this warehouse',
          errors: []
        });
      }
    }

    // Load active Financial Year
    const currentFY = await FinancialYear.findOne({ businessId: req.businessId, isCurrent: true });
    req.financialYear = currentFY ? currentFY.name : (req.business.currentFinancialYear || '2026-27');
    req.isFYLocked = currentFY ? currentFY.isLocked : false;

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to establish tenant context',
      errors: [error.message]
    });
  }
};

module.exports = { tenantContext };
