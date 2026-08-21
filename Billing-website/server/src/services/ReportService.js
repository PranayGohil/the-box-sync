const {
  Invoice,
  PurchaseBill,
  Payment,
  Expense,
  StockBalance,
  StockMovement,
  Customer,
  Supplier,
  Product
} = require('../models');

class ReportService {
  /**
   * Sales Register Report
   */
  static async getSalesRegister(businessId, startDate, endDate, customerId = null) {
    const matchQuery = {
      businessId,
      status: { $ne: 'cancelled' }
    };

    if (startDate || endDate) {
      matchQuery.invoiceDate = {};
      if (startDate) matchQuery.invoiceDate.$gte = new Date(startDate);
      if (endDate) matchQuery.invoiceDate.$lte = new Date(endDate);
    }

    if (customerId) {
      matchQuery.customerId = customerId;
    }

    const invoices = await Invoice.find(matchQuery).sort({ invoiceDate: -1 });

    const summary = invoices.reduce(
      (acc, inv) => {
        acc.totalTaxable += inv.taxableAmount || 0;
        acc.totalCGST += inv.cgstTotal || 0;
        acc.totalSGST += inv.sgstTotal || 0;
        acc.totalIGST += inv.igstTotal || 0;
        acc.totalTax += inv.totalTax || 0;
        acc.grandTotal += inv.grandTotal || 0;
        acc.totalPaid += inv.paidAmount || 0;
        acc.totalBalance += inv.balanceAmount || 0;
        return acc;
      },
      { totalTaxable: 0, totalCGST: 0, totalSGST: 0, totalIGST: 0, totalTax: 0, grandTotal: 0, totalPaid: 0, totalBalance: 0 }
    );

    return { invoices, summary };
  }

  /**
   * Purchase Register Report
   */
  static async getPurchaseRegister(businessId, startDate, endDate, supplierId = null) {
    const matchQuery = {
      businessId,
      status: { $ne: 'cancelled' }
    };

    if (startDate || endDate) {
      matchQuery.billDate = {};
      if (startDate) matchQuery.billDate.$gte = new Date(startDate);
      if (endDate) matchQuery.billDate.$lte = new Date(endDate);
    }

    if (supplierId) {
      matchQuery.supplierId = supplierId;
    }

    const bills = await PurchaseBill.find(matchQuery).sort({ billDate: -1 });

    const summary = bills.reduce(
      (acc, bill) => {
        acc.totalTaxable += bill.taxableAmount || 0;
        acc.totalCGST += bill.cgstTotal || 0;
        acc.totalSGST += bill.sgstTotal || 0;
        acc.totalIGST += bill.igstTotal || 0;
        acc.totalTax += bill.totalTax || 0;
        acc.grandTotal += bill.grandTotal || 0;
        acc.totalPaid += bill.paidAmount || 0;
        acc.totalBalance += bill.balanceAmount || 0;
        return acc;
      },
      { totalTaxable: 0, totalCGST: 0, totalSGST: 0, totalIGST: 0, totalTax: 0, grandTotal: 0, totalPaid: 0, totalBalance: 0 }
    );

    return { bills, summary };
  }

  /**
   * Stock Valuation & Inventory Summary
   */
  static async getStockValuation(businessId, warehouseId = null) {
    const query = { businessId };
    if (warehouseId) query.warehouseId = warehouseId;

    const balances = await StockBalance.find(query)
      .populate('productId', 'name sku barcode unit purchasePrice sellingPrice minStockAlert itemType')
      .populate('warehouseId', 'name code')
      .populate('batchId', 'batchNumber expiryDate');

    let totalStockQty = 0;
    let totalStockValuation = 0;
    let lowStockCount = 0;

    const items = balances
      .filter(b => b.productId && b.productId.itemType !== 'service')
      .map(b => {
        const qty = b.quantity || 0;
        const rate = b.averageCost || b.productId.purchasePrice || 0;
        const totalVal = qty * rate;
        const isLow = qty <= (b.productId.minStockAlert || 5);

        totalStockQty += qty;
        totalStockValuation += totalVal;
        if (isLow) lowStockCount++;

        return {
          productId: b.productId._id,
          productName: b.productId.name,
          sku: b.productId.sku,
          barcode: b.productId.barcode,
          warehouseName: b.warehouseId?.name || 'Main Warehouse',
          batchNumber: b.batchId?.batchNumber || 'Standard',
          expiryDate: b.batchId?.expiryDate,
          quantity: qty,
          reservedQuantity: b.reservedQuantity || 0,
          availableQuantity: b.availableQuantity || 0,
          averageCost: Number(rate.toFixed(2)),
          totalValue: Number(totalVal.toFixed(2)),
          isLowStock: isLow
        };
      });

    return {
      items,
      totalItemsCount: items.length,
      totalStockQty,
      totalStockValuation: Number(totalStockValuation.toFixed(2)),
      lowStockCount
    };
  }

  /**
   * GST GSTR-1 Summary (Outward Supplies)
   */
  static async getGSTR1Summary(businessId, startDate, endDate) {
    const matchQuery = { businessId, status: 'finalized' };
    if (startDate || endDate) {
      matchQuery.invoiceDate = {};
      if (startDate) matchQuery.invoiceDate.$gte = new Date(startDate);
      if (endDate) matchQuery.invoiceDate.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(matchQuery);

    const b2bInvoices = invoices.filter(inv => inv.customerGSTINSnapshot && inv.customerGSTINSnapshot.trim().length === 15);
    const b2cInvoices = invoices.filter(inv => !inv.customerGSTINSnapshot || inv.customerGSTINSnapshot.trim().length === 0);

    const calculateTotals = list =>
      list.reduce(
        (acc, inv) => {
          acc.count++;
          acc.taxableValue += inv.taxableAmount || 0;
          acc.cgst += inv.cgstTotal || 0;
          acc.sgst += inv.sgstTotal || 0;
          acc.igst += inv.igstTotal || 0;
          acc.totalTax += inv.totalTax || 0;
          acc.invoiceValue += inv.grandTotal || 0;
          return acc;
        },
        { count: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, invoiceValue: 0 }
      );

    return {
      b2b: { ...calculateTotals(b2bInvoices), invoices: b2bInvoices },
      b2c: { ...calculateTotals(b2cInvoices), invoices: b2cInvoices },
      totalOutwardTaxable: Number((b2bInvoices.reduce((s, i) => s + i.taxableAmount, 0) + b2cInvoices.reduce((s, i) => s + i.taxableAmount, 0)).toFixed(2)),
      totalOutputTax: Number((b2bInvoices.reduce((s, i) => s + i.totalTax, 0) + b2cInvoices.reduce((s, i) => s + i.totalTax, 0)).toFixed(2))
    };
  }

  /**
   * GST GSTR-3B Summary
   */
  static async getGSTR3BSummary(businessId, startDate, endDate) {
    const gstr1 = await ReportService.getGSTR1Summary(businessId, startDate, endDate);
    const purchaseReport = await ReportService.getPurchaseRegister(businessId, startDate, endDate);

    const itcEligible = {
      cgst: purchaseReport.summary.totalCGST,
      sgst: purchaseReport.summary.totalSGST,
      igst: purchaseReport.summary.totalIGST,
      totalITC: purchaseReport.summary.totalTax
    };

    const outputTax = {
      cgst: gstr1.b2b.cgst + gstr1.b2c.cgst,
      sgst: gstr1.b2b.sgst + gstr1.b2c.sgst,
      igst: gstr1.b2b.igst + gstr1.b2c.igst,
      totalOutput: gstr1.totalOutputTax
    };

    const netTaxPayable = {
      cgst: Math.max(0, outputTax.cgst - itcEligible.cgst),
      sgst: Math.max(0, outputTax.sgst - itcEligible.sgst),
      igst: Math.max(0, outputTax.igst - itcEligible.igst),
      totalNetPayable: Math.max(0, outputTax.totalOutput - itcEligible.totalITC)
    };

    return {
      outputTax,
      itcEligible,
      netTaxPayable
    };
  }
}

module.exports = ReportService;
