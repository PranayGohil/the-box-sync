const {
  TDSSection,
  TDSTransaction,
  GSTReconciliation,
  Invoice,
  PurchaseBill
} = require('../models');
const { DEFAULT_TDS_SECTIONS } = require('../config/constants');
const ReportService = require('../services/ReportService');

// @desc    Get GST Overview (Summary, GSTR-1, GSTR-3B)
// @route   GET /api/tax/gst-summary
exports.getGSTSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const gstr1 = await ReportService.getGSTR1Summary(req.businessId, startDate, endDate);
    const gstr3b = await ReportService.getGSTR3BSummary(req.businessId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: {
        gstr1,
        gstr3b
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get TDS Sections & Transactions
// @route   GET /api/tax/tds
exports.getTDS = async (req, res, next) => {
  try {
    let sections = await TDSSection.find({ businessId: req.businessId, isActive: true });
    if (sections.length === 0) {
      for (const sec of DEFAULT_TDS_SECTIONS) {
        await TDSSection.create({ businessId: req.businessId, ...sec });
      }
      sections = await TDSSection.find({ businessId: req.businessId, isActive: true });
    }

    const transactions = await TDSTransaction.find({ businessId: req.businessId }).sort({ date: -1 });

    const totalDeducted = transactions.reduce((s, t) => s + (t.tdsAmount || 0), 0);
    const totalDeposited = transactions.filter(t => t.status === 'deposited_to_govt').reduce((s, t) => s + (t.tdsAmount || 0), 0);
    const totalPayable = totalDeducted - totalDeposited;

    res.status(200).json({
      success: true,
      data: {
        sections,
        transactions,
        summary: {
          totalDeducted: Number(totalDeducted.toFixed(2)),
          totalDeposited: Number(totalDeposited.toFixed(2)),
          totalPayable: Number(totalPayable.toFixed(2))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create/Save TDS Section
// @route   POST /api/tax/tds/sections
exports.createTDSSection = async (req, res, next) => {
  try {
    const section = await TDSSection.create({
      ...req.body,
      businessId: req.businessId
    });
    res.status(201).json({ success: true, message: 'TDS Section created', data: section });
  } catch (error) {
    next(error);
  }
};

// @desc    Perform GST Reconciliation (Compare uploaded GSTR-2B external records with internal purchase bills)
// @route   POST /api/tax/gst-reconcile
exports.reconcileGST = async (req, res, next) => {
  try {
    const { returnPeriod = '042026', externalRecords = [] } = req.body;

    const purchaseBills = await PurchaseBill.find({ businessId: req.businessId, status: { $ne: 'cancelled' } });

    let matchedCount = 0;
    let mismatchCount = 0;
    let missingInBooksCount = 0;

    const reconciledItems = externalRecords.map(ext => {
      // Find matching internal purchase bill by supplier invoice no or GSTIN
      const match = purchaseBills.find(b =>
        b.supplierGSTINSnapshot?.toUpperCase() === ext.gstin?.toUpperCase() &&
        (b.supplierInvoiceNo?.toLowerCase() === ext.invoiceNo?.toLowerCase() || b.billNo?.toLowerCase() === ext.invoiceNo?.toLowerCase())
      );

      let status = 'MISSING_IN_BOOKS';
      let discrepancyDetails = '';

      if (match) {
        const diff = Math.abs(match.grandTotal - (Number(ext.invoiceValue) || Number(ext.taxableValue) + Number(ext.totalTax)));
        if (diff < 1.0) {
          status = 'MATCHED';
          matchedCount++;
        } else {
          status = 'MISMATCH_AMOUNT';
          mismatchCount++;
          discrepancyDetails = `Amount discrepancy: Portal has ₹${ext.invoiceValue}, Books have ₹${match.grandTotal}`;
        }
      } else {
        missingInBooksCount++;
        discrepancyDetails = 'Invoice present in GSTR-2B portal but missing in Purchase Books';
      }

      return {
        gstin: ext.gstin,
        supplierName: ext.supplierName || 'Supplier',
        invoiceNo: ext.invoiceNo,
        invoiceDate: ext.invoiceDate || new Date(),
        taxableValue: Number(ext.taxableValue) || 0,
        cgst: Number(ext.cgst) || 0,
        sgst: Number(ext.sgst) || 0,
        igst: Number(ext.igst) || 0,
        totalTax: Number(ext.totalTax) || 0,
        internalBillId: match?._id || null,
        status,
        discrepancyDetails
      };
    });

    const reconciliation = await GSTReconciliation.create({
      businessId: req.businessId,
      returnPeriod,
      reconciliationType: 'GSTR-2B',
      totalPortalInvoices: externalRecords.length,
      totalBooksInvoices: purchaseBills.length,
      matchedCount,
      mismatchCount,
      missingInBooksCount,
      items: reconciledItems,
      reconciledBy: req.user._id
    });

    res.status(200).json({
      success: true,
      message: 'GST Reconciliation completed',
      data: reconciliation
    });
  } catch (error) {
    next(error);
  }
};
