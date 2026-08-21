const jwt = require('jsonwebtoken');
const { User, Business, BusinessMember, FinancialYear } = require('../models');
const { ROLES, DEFAULT_ROLE_PERMISSIONS } = require('../config/constants');
const AccountingService = require('../services/AccountingService');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'super_secret_billing_erp_jwt_key_2026_secure', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register a new user & create their primary business
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, mobile, password, businessName, state, stateCode, gstin } = req.body;

    if (!name || !email || !password || !businessName || !state) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, business name and state are required'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      mobile,
      password
    });

    const business = await Business.create({
      name: businessName,
      legalName: businessName,
      state,
      stateCode: stateCode || '27',
      gstin: gstin || '',
      taxType: gstin ? 'regular' : 'unregistered',
      currentFinancialYear: '2026-27',
      createdBy: user._id
    });

    // Create Initial Financial Year
    await FinancialYear.create({
      businessId: business._id,
      name: '2026-27',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isCurrent: true
    });

    // Assign User as Owner with Full Permissions
    await BusinessMember.create({
      businessId: business._id,
      userId: user._id,
      role: ROLES.OWNER,
      permissions: DEFAULT_ROLE_PERMISSIONS[ROLES.OWNER],
      isAllBranches: true,
      isAllWarehouses: true
    });

    // Seed default Chart of Accounts for this business
    await AccountingService.seedDefaultChartOfAccounts(business._id);

    user.defaultBusinessId = business._id;
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Business initialized.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile
        },
        business: {
          id: business._id,
          name: business.name,
          state: business.state,
          stateCode: business.stateCode,
          gstin: business.gstin
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & return businesses
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    // Find all businesses user is member of
    const memberships = await BusinessMember.find({ userId: user._id, status: 'active' }).populate('businessId');
    const businesses = memberships.map(m => ({
      id: m.businessId._id,
      name: m.businessId.name,
      legalName: m.businessId.legalName,
      gstin: m.businessId.gstin,
      state: m.businessId.state,
      stateCode: m.businessId.stateCode,
      role: m.role,
      permissions: m.permissions,
      logoUrl: m.businessId.logoUrl
    }));

    const activeBusiness = businesses[0] || null;
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile
        },
        activeBusiness,
        businesses
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile & business context
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const memberships = await BusinessMember.find({ userId: req.user._id, status: 'active' }).populate('businessId');
    const businesses = memberships.map(m => ({
      id: m.businessId._id,
      name: m.businessId.name,
      legalName: m.businessId.legalName,
      gstin: m.businessId.gstin,
      state: m.businessId.state,
      stateCode: m.businessId.stateCode,
      role: m.role,
      permissions: m.permissions,
      logoUrl: m.businessId.logoUrl,
      settings: m.businessId.settings,
      bankDetails: m.businessId.bankDetails,
      upiId: m.businessId.upiId
    }));

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
        businesses
      }
    });
  } catch (error) {
    next(error);
  }
};
