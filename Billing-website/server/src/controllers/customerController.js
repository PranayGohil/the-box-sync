const { Customer, Invoice, Payment, JournalEntryLine } = require('../models');

// @desc    Get all customers with search & pagination
// @route   GET /api/customers
exports.getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50, customerType } = req.query;
    const query = { businessId: req.businessId, isDeleted: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } }
      ];
    }

    if (customerType) {
      query.customerType = customerType;
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: customers,
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

// @desc    Get customer by ID with full transaction history & statement
// @route   GET /api/customers/:id
exports.getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, businessId: req.businessId });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const invoices = await Invoice.find({ businessId: req.businessId, customerId: customer._id }).sort({ invoiceDate: -1 });
    const payments = await Payment.find({ businessId: req.businessId, partyId: customer._id, paymentType: 'in' }).sort({ date: -1 });
    const ledgerEntries = await JournalEntryLine.find({ businessId: req.businessId, partyId: customer._id }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: {
        customer,
        invoices,
        payments,
        ledgerEntries
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new customer
// @route   POST /api/customers
exports.createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create({
      ...req.body,
      businessId: req.businessId,
      currentBalance: req.body.openingBalance || 0
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft-delete customer
// @route   DELETE /api/customers/:id
exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      { isDeleted: true },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
