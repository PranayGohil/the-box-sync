const { Business, BusinessMember, Branch, Warehouse, User, FinancialYear } = require('../models');
const { ROLES, DEFAULT_ROLE_PERMISSIONS } = require('../config/constants');
const AccountingService = require('../services/AccountingService');

// @desc    Create an additional business
// @route   POST /api/businesses
exports.createBusiness = async (req, res, next) => {
  try {
    const { name, legalName, gstin, state, stateCode, phone, email, address, bankDetails, upiId } = req.body;

    const business = await Business.create({
      name,
      legalName: legalName || name,
      gstin,
      state,
      stateCode: stateCode || '27',
      phone,
      email,
      address,
      bankDetails,
      upiId,
      createdBy: req.user._id
    });

    await FinancialYear.create({
      businessId: business._id,
      name: '2026-27',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isCurrent: true
    });

    await BusinessMember.create({
      businessId: business._id,
      userId: req.user._id,
      role: ROLES.OWNER,
      permissions: DEFAULT_ROLE_PERMISSIONS[ROLES.OWNER],
      isAllBranches: true,
      isAllWarehouses: true
    });

    await AccountingService.seedDefaultChartOfAccounts(business._id);

    res.status(201).json({
      success: true,
      message: 'Business created successfully',
      data: business
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current business details
// @route   GET /api/businesses/profile
exports.getBusinessProfile = async (req, res, next) => {
  try {
    const business = await Business.findById(req.businessId);
    const branches = await Branch.find({ businessId: req.businessId, isActive: true });
    const warehouses = await Warehouse.find({ businessId: req.businessId, isActive: true });

    res.status(200).json({
      success: true,
      data: {
        business,
        branches,
        warehouses
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update business profile & settings
// @route   PUT /api/businesses/profile
exports.updateBusinessProfile = async (req, res, next) => {
  try {
    const updated = await Business.findByIdAndUpdate(req.businessId, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Business profile updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List members of the current business
// @route   GET /api/businesses/members
exports.getMembers = async (req, res, next) => {
  try {
    const members = await BusinessMember.find({ businessId: req.businessId })
      .populate('userId', 'name email mobile avatarUrl status')
      .populate('branchAccess', 'name code')
      .populate('warehouseAccess', 'name code');

    res.status(200).json({
      success: true,
      data: members
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Invite/Add a user as member to business
// @route   POST /api/businesses/members
exports.addMember = async (req, res, next) => {
  try {
    const { email, role, permissions, branchAccess, warehouseAccess, isAllBranches, isAllWarehouses } = req.body;

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Create user placeholder with default password
      user = await User.create({
        name: email.split('@')[0],
        email: email.toLowerCase(),
        password: 'ChangeMe@123'
      });
    }

    const existingMember = await BusinessMember.findOne({ businessId: req.businessId, userId: user._id });
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'This user is already a member of this business'
      });
    }

    const member = await BusinessMember.create({
      businessId: req.businessId,
      userId: user._id,
      role: role || ROLES.BILLING_USER,
      permissions: permissions || DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS[ROLES.BILLING_USER],
      branchAccess: branchAccess || [],
      warehouseAccess: warehouseAccess || [],
      isAllBranches: isAllBranches !== undefined ? isAllBranches : true,
      isAllWarehouses: isAllWarehouses !== undefined ? isAllWarehouses : true
    });

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: member
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a Branch
// @route   POST /api/businesses/branches
exports.createBranch = async (req, res, next) => {
  try {
    const branch = await Branch.create({
      ...req.body,
      businessId: req.businessId
    });
    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a Warehouse
// @route   POST /api/businesses/warehouses
exports.createWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.create({
      ...req.body,
      businessId: req.businessId
    });
    res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    next(error);
  }
};
