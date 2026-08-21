const xlsx = require('xlsx');
const { Customer, Supplier, Product, Invoice, PurchaseBill, StockBalance } = require('../models');

// @desc    Export Entity Data as Excel / JSON
// @route   GET /api/data-transfer/export/:entityType
exports.exportData = async (req, res, next) => {
  try {
    const { entityType } = req.params;
    let data = [];

    if (entityType === 'customers') {
      const customers = await Customer.find({ businessId: req.businessId, isDeleted: false });
      data = customers.map(c => ({
        Name: c.name,
        BusinessName: c.businessName || '',
        Phone: c.phone || '',
        Email: c.email || '',
        GSTIN: c.gstin || '',
        PAN: c.pan || '',
        State: c.billingAddress?.state || '',
        CurrentBalance: c.currentBalance || 0
      }));
    } else if (entityType === 'suppliers') {
      const suppliers = await Supplier.find({ businessId: req.businessId, isDeleted: false });
      data = suppliers.map(s => ({
        Name: s.name,
        Company: s.companyName || '',
        Phone: s.phone || '',
        Email: s.email || '',
        GSTIN: s.gstin || '',
        State: s.address?.state || '',
        CurrentBalance: s.currentBalance || 0
      }));
    } else if (entityType === 'products') {
      const products = await Product.find({ businessId: req.businessId, isDeleted: false });
      data = products.map(p => ({
        Name: p.name,
        SKU: p.sku || '',
        Barcode: p.barcode || '',
        HSN: p.hsnSacCode || '',
        SellingPrice: p.sellingPrice || 0,
        PurchasePrice: p.purchasePrice || 0,
        TaxRate: p.taxRate || 18,
        CurrentStock: p.currentStock || 0
      }));
    } else if (entityType === 'invoices') {
      const invoices = await Invoice.find({ businessId: req.businessId });
      data = invoices.map(i => ({
        InvoiceNo: i.invoiceNo,
        Date: i.invoiceDate?.toISOString().split('T')[0],
        Customer: i.customerNameSnapshot,
        TaxableValue: i.taxableAmount,
        TotalTax: i.totalTax,
        GrandTotal: i.grandTotal,
        Paid: i.paidAmount,
        Balance: i.balanceAmount,
        Status: i.status
      }));
    }

    res.status(200).json({
      success: true,
      entityType,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};
