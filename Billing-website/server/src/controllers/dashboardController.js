const {
  Invoice,
  PurchaseBill,
  Payment,
  Expense,
  Customer,
  Supplier,
  Product,
  StockBalance
} = require('../models');

// @desc    Get complete real-time Dashboard statistics, KPIs, and Charts
// @route   GET /api/dashboard
exports.getDashboardStats = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query; // 'today', 'week', 'month', 'year'

    const now = new Date();
    let startDate = new Date();

    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      // Month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // 1. Invoices & Sales
    const invoices = await Invoice.find({
      businessId: req.businessId,
      status: { $ne: 'cancelled' },
      invoiceDate: { $gte: startDate }
    });

    const totalSales = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const totalTaxCollected = invoices.reduce((sum, inv) => sum + (inv.totalTax || 0), 0);

    // 2. Purchases
    const bills = await PurchaseBill.find({
      businessId: req.businessId,
      status: { $ne: 'cancelled' },
      billDate: { $gte: startDate }
    });
    const totalPurchases = bills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);

    // 3. Payments In / Collections
    const paymentsIn = await Payment.find({
      businessId: req.businessId,
      paymentType: 'in',
      status: 'completed',
      date: { $gte: startDate }
    });
    const totalCollections = paymentsIn.reduce((sum, p) => sum + (p.amount || 0), 0);

    // 4. Expenses
    const expenses = await Expense.find({
      businessId: req.businessId,
      status: 'paid',
      date: { $gte: startDate }
    });
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.netPayable || 0), 0);

    // 5. Total Outstanding Receivables & Payables (All Time)
    const allUnpaidInvoices = await Invoice.find({
      businessId: req.businessId,
      status: 'finalized',
      paymentStatus: { $in: ['unpaid', 'partially_paid'] }
    });
    const totalReceivables = allUnpaidInvoices.reduce((sum, inv) => sum + (inv.balanceAmount || 0), 0);

    const allUnpaidBills = await PurchaseBill.find({
      businessId: req.businessId,
      status: 'finalized',
      paymentStatus: { $in: ['unpaid', 'partially_paid'] }
    });
    const totalPayables = allUnpaidBills.reduce((sum, b) => sum + (b.balanceAmount || 0), 0);

    // 6. Stock Valuation & Low Stock Products
    const products = await Product.find({ businessId: req.businessId, isDeleted: false, itemType: 'goods' });
    let totalStockValuation = 0;
    const lowStockItems = [];

    products.forEach(p => {
      const stock = p.currentStock || 0;
      const rate = p.purchasePrice || 0;
      totalStockValuation += (stock * rate);
      if (stock <= (p.minStockAlert || 5)) {
        lowStockItems.push({
          id: p._id,
          name: p.name,
          sku: p.sku,
          currentStock: stock,
          minStockAlert: p.minStockAlert || 5,
          unit: p.unitId?.symbol || 'PCS'
        });
      }
    });

    // 7. Recent Invoices
    const recentInvoices = await Invoice.find({ businessId: req.businessId })
      .sort({ createdAt: -1 })
      .limit(6);

    // 8. Monthly Sales vs Purchase Chart Data (Last 6 Months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = now.getMonth();
    const chartLabels = [];
    const chartSales = [];
    const chartPurchases = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), currentMonthIndex - i, 1);
      const nextD = new Date(now.getFullYear(), currentMonthIndex - i + 1, 1);
      chartLabels.push(months[d.getMonth()]);

      const mInvoices = await Invoice.find({
        businessId: req.businessId,
        status: { $ne: 'cancelled' },
        invoiceDate: { $gte: d, $lt: nextD }
      });
      const mSales = mInvoices.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
      chartSales.push(Number(mSales.toFixed(2)));

      const mBills = await PurchaseBill.find({
        businessId: req.businessId,
        status: { $ne: 'cancelled' },
        billDate: { $gte: d, $lt: nextD }
      });
      const mPurchases = mBills.reduce((s, b) => s + (b.grandTotal || 0), 0);
      chartPurchases.push(Number(mPurchases.toFixed(2)));
    }

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalSales: Number(totalSales.toFixed(2)),
          totalPurchases: Number(totalPurchases.toFixed(2)),
          totalCollections: Number(totalCollections.toFixed(2)),
          totalExpenses: Number(totalExpenses.toFixed(2)),
          totalReceivables: Number(totalReceivables.toFixed(2)),
          totalPayables: Number(totalPayables.toFixed(2)),
          totalStockValuation: Number(totalStockValuation.toFixed(2)),
          totalTaxCollected: Number(totalTaxCollected.toFixed(2)),
          invoiceCount: invoices.length,
          lowStockCount: lowStockItems.length
        },
        charts: {
          labels: chartLabels,
          sales: chartSales,
          purchases: chartPurchases
        },
        lowStockItems: lowStockItems.slice(0, 10),
        recentInvoices
      }
    });
  } catch (error) {
    next(error);
  }
};
