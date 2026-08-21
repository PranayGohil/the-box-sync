const { Supplier, PurchaseBill, Payment, JournalEntryLine } = require('../models');

// @desc    Get all suppliers with search & pagination
// @route   GET /api/suppliers
exports.getSuppliers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = { businessId: req.businessId, isDeleted: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Supplier.countDocuments(query);
    const suppliers = await Supplier.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: suppliers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get supplier by ID with bills & ledger
// @route   GET /api/suppliers/:id
exports.getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const bills = await PurchaseBill.find({ businessId: req.businessId, supplierId: supplier._id }).sort({ billDate: -1 });
    const payments = await Payment.find({ businessId: req.businessId, partyId: supplier._id, paymentType: 'out' }).sort({ date: -1 });
    const ledgerEntries = await JournalEntryLine.find({ businessId: req.businessId, partyId: supplier._id }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: {
        supplier,
        bills,
        payments,
        ledgerEntries
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new supplier
// @route   POST /api/suppliers
exports.createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create({
      ...req.body,
      businessId: req.businessId,
      currentBalance: req.body.openingBalance || 0
    });

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete supplier (soft-delete)
// @route   DELETE /api/suppliers/:id
exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      { isDeleted: true },
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
