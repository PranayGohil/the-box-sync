const ReportService = require('../services/ReportService');
const { Customer, Supplier, Invoice, PurchaseBill } = require('../models');

// @desc    Get Sales Register Report
// @route   GET /api/reports/sales-register
exports.getSalesRegister = async (req, res, next) => {
  try {
    const { startDate, endDate, customerId } = req.query;
    const report = await ReportService.getSalesRegister(req.businessId, startDate, endDate, customerId);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Purchase Register Report
// @route   GET /api/reports/purchase-register
exports.getPurchaseRegister = async (req, res, next) => {
  try {
    const { startDate, endDate, supplierId } = req.query;
    const report = await ReportService.getPurchaseRegister(req.businessId, startDate, endDate, supplierId);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Stock Valuation Report
// @route   GET /api/reports/stock-valuation
exports.getStockValuation = async (req, res, next) => {
  try {
    const { warehouseId } = req.query;
    const report = await ReportService.getStockValuation(req.businessId, warehouseId);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Customer Receivables Aging Report (0-30 days, 31-60 days, 61-90 days, 90+ days)
// @route   GET /api/reports/receivables-aging
exports.getReceivablesAging = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({
      businessId: req.businessId,
      status: 'finalized',
      paymentStatus: { $in: ['unpaid', 'partially_paid'] }
    }).populate('customerId', 'name phone creditDays');

    const now = new Date();
    const aging = {
      bucket0_30: 0,
      bucket31_60: 0,
      bucket61_90: 0,
      bucket90_plus: 0,
      totalOutstanding: 0,
      items: []
    };

    invoices.forEach(inv => {
      const invDate = new Date(inv.invoiceDate);
      const daysOverdue = Math.floor((now - invDate) / (24 * 60 * 60 * 1000));
      const bal = inv.balanceAmount || 0;

      let bucket = '0-30 Days';
      if (daysOverdue > 90) {
        bucket = '90+ Days';
        aging.bucket90_plus += bal;
      } else if (daysOverdue > 60) {
        bucket = '61-90 Days';
        aging.bucket61_90 += bal;
      } else if (daysOverdue > 30) {
        bucket = '31-60 Days';
        aging.bucket31_60 += bal;
      } else {
        aging.bucket0_30 += bal;
      }

      aging.totalOutstanding += bal;
      aging.items.push({
        invoiceNo: inv.invoiceNo,
        invoiceDate: inv.invoiceDate,
        customerName: inv.customerNameSnapshot,
        grandTotal: inv.grandTotal,
        balanceAmount: bal,
        daysOverdue,
        bucket
      });
    });

    aging.bucket0_30 = Number(aging.bucket0_30.toFixed(2));
    aging.bucket31_60 = Number(aging.bucket31_60.toFixed(2));
    aging.bucket61_90 = Number(aging.bucket61_90.toFixed(2));
    aging.bucket90_plus = Number(aging.bucket90_plus.toFixed(2));
    aging.totalOutstanding = Number(aging.totalOutstanding.toFixed(2));

    res.status(200).json({ success: true, data: aging });
  } catch (error) {
    next(error);
  }
};
