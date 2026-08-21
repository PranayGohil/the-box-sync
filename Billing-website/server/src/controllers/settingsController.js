const {
  AuditLog,
  Notification,
  Sequence,
  Customer,
  Supplier,
  Product,
  Invoice,
  PurchaseBill
} = require('../models');

// @desc    Get Audit Logs
// @route   GET /api/settings/audit-logs
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { module, page = 1, limit = 50 } = req.query;
    const query = { businessId: req.businessId };
    if (module) query.module = module;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: logs,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get In-App Notifications
// @route   GET /api/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ businessId: req.businessId })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark Notification as Read
// @route   PUT /api/notifications/:id/read
exports.markNotificationRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Global Search across Customers, Suppliers, Products, Invoices, Bills
// @route   GET /api/search
exports.globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(200).json({ success: true, data: { customers: [], suppliers: [], products: [], invoices: [], bills: [] } });
    }

    const regex = new RegExp(q.trim(), 'i');

    const [customers, suppliers, products, invoices, bills] = await Promise.all([
      Customer.find({ businessId: req.businessId, isDeleted: false, $or: [{ name: regex }, { phone: regex }, { gstin: regex }] }).limit(5),
      Supplier.find({ businessId: req.businessId, isDeleted: false, $or: [{ name: regex }, { companyName: regex }, { phone: regex }] }).limit(5),
      Product.find({ businessId: req.businessId, isDeleted: false, $or: [{ name: regex }, { sku: regex }, { barcode: regex }] }).limit(5),
      Invoice.find({ businessId: req.businessId, $or: [{ invoiceNo: regex }, { customerNameSnapshot: regex }] }).limit(5),
      PurchaseBill.find({ businessId: req.businessId, $or: [{ billNo: regex }, { supplierInvoiceNo: regex }, { supplierNameSnapshot: regex }] }).limit(5)
    ]);

    res.status(200).json({
      success: true,
      data: {
        customers,
        suppliers,
        products,
        invoices,
        bills
      }
    });
  } catch (error) {
    next(error);
  }
};
