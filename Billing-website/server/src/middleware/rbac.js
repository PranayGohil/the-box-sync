const { ROLES } = require('../config/constants');

const requirePermission = (moduleName, action = 'view') => {
  return (req, res, next) => {
    // Owners always have bypass for all module actions
    if (req.userRole === ROLES.OWNER) {
      return next();
    }

    const modulePerms = req.permissions?.[moduleName];
    if (modulePerms && modulePerms[action] === true) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied: You do not have permission to ${action} in ${moduleName}`,
      errors: []
    });
  };
};

const checkFinancialYearLock = (req, res, next) => {
  if (req.isFYLocked && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(400).json({
      success: false,
      message: `Financial Year ${req.financialYear} is locked. Transactions cannot be created, modified or cancelled in a locked period.`,
      errors: []
    });
  }
  next();
};

module.exports = { requirePermission, checkFinancialYearLock };
