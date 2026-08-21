const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required to access this resource',
        errors: []
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_billing_erp_jwt_key_2026_secure');
    const user = await User.findById(decoded.id).select('-password');

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User not found or account is deactivated',
        errors: []
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token',
      errors: [error.message]
    });
  }
};

module.exports = { protect };
