const mongoose = require('mongoose');
const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const CreditDebitNote = require('../models/CreditDebitNote');
const SalesOrder = require('../models/SalesOrder');
const PurchaseOrder = require('../models/PurchaseOrder');
const Catalog = require('../models/catalogModel');
const StockSalesLog = require('../models/stockSalesLogModel');
const Ledger = require('../models/ledgerModel');
const NumberSeries = require('../models/numberSeriesModel');
const ShopAuditLog = require('../models/shopAuditLogModel');
const User = require('../models/userModel');
const { generatePDF } = require('../utils/pdfGenerator');

// Helpers
const getLocalDateTimeString = (date) => {
  const d = date ? new Date(date) : new Date();
  return d.toISOString();
};

const numberToWords = (num) => {
  if (num === 0) return 'Zero';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convert = (n) => {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : '');
    return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + convert(n % 100) : '');
  };

  let reg = convert(Math.floor(num));
  return reg.trim() + ' Rupees Only';
};

// Stock Adjuster Helper (soft changes, logs)
const adjustCatalogStock = async (userId, items, direction = -1, docType = 'Invoice', docId = null) => {
  if (!userId || !Array.isArray(items) || items.length === 0) return;
  try {
    const catalogs = await Catalog.find({ user_id: String(userId) });
    for (const itemData of items) {
      const name = itemData.name || itemData.item_name;
      const qty = Number(itemData.quantity || 1);
      const variantName = itemData.variant || itemData.selected_variant;

      if (!name || qty <= 0) continue;

      for (const catalogDoc of catalogs) {
        let modified = false;
        for (const item of catalogDoc.items) {
          if (item.item_name?.trim().toLowerCase() === name.trim().toLowerCase()) {
            if (item.has_variants && Array.isArray(item.variants) && item.variants.length > 0) {
              const variant = item.variants.find(
                (v) => v.size_name?.trim().toLowerCase() === String(variantName || '').trim().toLowerCase()
              ) || item.variants[0];

              if (variant && variant.stock_quantity !== null && variant.stock_quantity !== undefined) {
                const change = direction * qty;
                variant.stock_quantity = Math.max(0, variant.stock_quantity + change);
                variant.is_available = variant.stock_quantity > 0;
                
                if (item.variants[0] === variant) {
                  item.stock_quantity = variant.stock_quantity;
                  item.is_available = item.stock_quantity > 0;
                }
                modified = true;

                await StockSalesLog.create({
                  user_id: String(userId),
                  item_id: String(item._id),
                  item_name: item.item_name,
                  variant_name: variant.size_name,
                  category: catalogDoc.category,
                  type: direction > 0 ? 'Addition' : 'Sale',
                  quantity_changed: change,
                  balance_stock: variant.stock_quantity,
                  order_id: docId ? String(docId) : null,
                  order_type: docType,
                  remarks: `Updated via ${docType}`
                });
              }
            } else if (item.stock_quantity !== null && item.stock_quantity !== undefined) {
              const change = direction * qty;
              item.stock_quantity = Math.max(0, item.stock_quantity + change);
              item.is_available = item.stock_quantity > 0;

              if (Array.isArray(item.variants) && item.variants[0]) {
                item.variants[0].stock_quantity = item.stock_quantity;
                item.variants[0].is_available = item.stock_quantity > 0;
              }
              modified = true;

              await StockSalesLog.create({
                user_id: String(userId),
                item_id: String(item._id),
                item_name: item.item_name,
                variant_name: '',
                category: catalogDoc.category,
                type: direction > 0 ? 'Addition' : 'Sale',
                quantity_changed: change,
                balance_stock: item.stock_quantity,
                order_id: docId ? String(docId) : null,
                order_type: docType,
                remarks: `Updated via ${docType}`
              });
            }
          }
        }
        if (modified) {
          await catalogDoc.save();
        }
      }
    }
  } catch (err) {
    console.error("Error adjusting stock:", err);
  }
};

// Automatic prefix and sequence numbers
const getNextNumber = async (shopId, docType) => {
  let series = await NumberSeries.findOne({ shopId, docType });
  if (!series) {
    const prefixes = {
      Invoice: 'INV-2026-',
      SalesOrder: 'SO-2026-',
      PurchaseOrder: 'PO-2026-',
      CreditNote: 'CN-2026-',
      DebitNote: 'DN-2026-'
    };
    series = new NumberSeries({
      shopId,
      docType,
      prefix: prefixes[docType] || `${docType.toUpperCase()}-2026-`,
      currentSequence: 0,
      digits: 4
    });
  }
  series.currentSequence += 1;
  await series.save();
  return `${series.prefix}${String(series.currentSequence).padStart(series.digits, '0')}`;
};

// Number Series Configuration
exports.getNumberSeries = async (req, res) => {
  try {
    const configs = await NumberSeries.find({ shopId: req.user._id });
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateNumberSeries = async (req, res) => {
  try {
    const { docType, prefix, digits } = req.body;
    let config = await NumberSeries.findOne({ shopId: req.user._id, docType });
    if (config) {
      config.prefix = prefix;
      config.digits = digits || config.digits;
      await config.save();
    } else {
      config = new NumberSeries({ shopId: req.user._id, docType, prefix, digits });
      await config.save();
    }
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Double-Entry Ledger Entry Post
const postLedgerEntry = async (shopId, date, referenceModel, referenceId, description, entries) => {
  const ledger = new Ledger({
    shopId,
    date,
    referenceModel,
    referenceId,
    description,
    entries
  });
  await ledger.save();
};

// Action Audit Logging helper
const writeAuditLog = async (userId, shopId, action, details) => {
  try {
    await ShopAuditLog.create({ userId, shopId, action, details });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
};

// Invoices
exports.createInvoice = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const shopId = req.user._id;
    const body = { ...req.body, shopId };
    
    // Auto-generate invoice number if missing
    if (!body.invoiceNumber) {
      body.invoiceNumber = await getNextNumber(shopId, 'Invoice');
    }

    // Determine state/tax matching rules
    const seller = await User.findById(shopId);
    const sellerState = seller?.state || '';
    const buyerState = body.customerDetails?.state || '';
    const isInterstate = sellerState.trim().toLowerCase() !== buyerState.trim().toLowerCase();

    // Map and verify items list calculations
    let subTotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    body.items = (body.items || []).map((item) => {
      const qty = Number(item.quantity) || 1;
      const rate = Number(item.rate || item.unitPrice) || 0;
      const disc = Number(item.discount || 0);
      const taxRate = Number(item.taxRate || item.gstPercentage) || 0;

      const baseAmount = (rate * qty) - disc;
      const taxable = baseAmount;
      const tax = (taxable * taxRate) / 100;

      let cgst = 0, sgst = 0, igst = 0;
      if (isInterstate) {
        igst = tax;
      } else {
        cgst = tax / 2;
        sgst = tax / 2;
      }

      subTotal += taxable;
      totalCGST += cgst;
      totalSGST += sgst;
      totalIGST += igst;

      return {
        ...item,
        quantity: qty,
        rate,
        discount: disc,
        taxableAmount: parseFloat(taxable.toFixed(2)),
        gstPercentage: taxRate,
        cgst: parseFloat(cgst.toFixed(2)),
        sgst: parseFloat(sgst.toFixed(2)),
        igst: parseFloat(igst.toFixed(2)),
        finalAmount: parseFloat((taxable + tax).toFixed(2))
      };
    });

    const grandTotal = subTotal + totalCGST + totalSGST + totalIGST;

    let extraAmount = 0;
    if (body.extraDetails && body.extraDetails.isApplied) {
      const extraVal = Number(body.extraDetails.value) || 0;
      if (body.extraDetails.rateType === 'percentage') {
        extraAmount = parseFloat(((subTotal * extraVal) / 100).toFixed(2));
      } else {
        extraAmount = parseFloat(extraVal.toFixed(2));
      }
      body.extraDetails.amount = extraAmount;
    } else {
      body.extraDetails = {
        isApplied: false,
        name: '',
        rateType: 'amount',
        value: 0,
        amount: 0
      };
    }

    const finalInvoiceTotal = grandTotal + extraAmount;

    body.summary = {
      taxableValue: parseFloat(subTotal.toFixed(2)),
      cgstTotal: parseFloat(totalCGST.toFixed(2)),
      sgstTotal: parseFloat(totalSGST.toFixed(2)),
      igstTotal: parseFloat(totalIGST.toFixed(2)),
      grandTotal: parseFloat(finalInvoiceTotal.toFixed(2)),
      roundOff: parseFloat((Math.round(finalInvoiceTotal) - finalInvoiceTotal).toFixed(2)),
      amountInWords: numberToWords(Math.round(finalInvoiceTotal))
    };

    let tdsAmount = 0;
    if (body.tdsDetails && body.tdsDetails.isTDSDeducted) {
      const tdsVal = Number(body.tdsDetails.value) || 0;
      if (body.tdsDetails.rateType === 'percentage') {
        tdsAmount = parseFloat(((subTotal * tdsVal) / 100).toFixed(2));
      } else {
        tdsAmount = parseFloat(tdsVal.toFixed(2));
      }
      body.tdsDetails.amount = tdsAmount;
    } else {
      body.tdsDetails = {
        isTDSDeducted: false,
        name: '',
        description: '',
        rateType: 'percentage',
        value: 0,
        amount: 0
      };
    }

    body.amountDue = Math.round(finalInvoiceTotal - tdsAmount) - (body.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);

    const invoice = new Invoice(body);
    await invoice.save({ session });

    if (body.purchaseOrderId) {
      await PurchaseOrder.findByIdAndUpdate(body.purchaseOrderId, { status: 'Completed' }, { session });
    }

    // Deduct stock for Invoice items
    await adjustCatalogStock(shopId, invoice.items, -1, 'Invoice', invoice._id);

    // Double-entry accounting ledger mapping
    const netReceivable = Math.round(finalInvoiceTotal - tdsAmount);
    const ledgerEntries = [
      { accountName: 'Accounts Receivable', debit: netReceivable, credit: 0 },
      { accountName: 'Sales Revenue', debit: 0, credit: parseFloat(subTotal.toFixed(2)) }
    ];
    if (extraAmount !== 0) {
      if (extraAmount > 0) {
        ledgerEntries.push({ accountName: 'Other Income', debit: 0, credit: parseFloat(extraAmount.toFixed(2)) });
      } else {
        ledgerEntries.push({ accountName: 'Discount Allowed', debit: parseFloat(Math.abs(extraAmount).toFixed(2)), credit: 0 });
      }
    }
    if (tdsAmount > 0) {
      ledgerEntries.push({ accountName: 'TDS Receivable', debit: parseFloat(tdsAmount.toFixed(2)), credit: 0 });
    }
    if (totalCGST > 0) ledgerEntries.push({ accountName: 'CGST Payable', debit: 0, credit: parseFloat(totalCGST.toFixed(2)) });
    if (totalSGST > 0) ledgerEntries.push({ accountName: 'SGST Payable', debit: 0, credit: parseFloat(totalSGST.toFixed(2)) });
    if (totalIGST > 0) ledgerEntries.push({ accountName: 'IGST Payable', debit: 0, credit: parseFloat(totalIGST.toFixed(2)) });
    
    await postLedgerEntry(shopId, invoice.date, 'Invoice', invoice._id, `Sales Invoice ${invoice.invoiceNumber}`, ledgerEntries);

    // Log the action
    await writeAuditLog(req.user._id, shopId, 'CREATE_INVOICE', { invoiceNumber: invoice.invoiceNumber, grandTotal });

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const filter = { shopId: req.user._id, isDeleted: false };
    const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).lean();

    // Fetch POS orders that are completed/paid
    const Order = require('../models/orderModel');
    const posOrders = await Order.find({ user_id: String(req.user._id), order_status: 'Paid' }).sort({ createdAt: -1 }).lean();

    // Format POS orders to match Invoice structure for Credit Note selection
    const formattedOrders = posOrders.map(order => ({
      _id: order._id,
      invoiceNumber: order.order_no || `POS-${order._id}`,
      date: order.order_date || order.createdAt,
      customerDetails: {
        name: order.customer_name || 'Walk-in Customer',
        phone: order.customer_phone || '',
        billingAddress: '',
        gstin: ''
      },
      items: (order.order_items || []).map(item => ({
        name: item.item_name || '',
        hsnCode: item.hsnCode || 'General',
        quantity: item.quantity || 1,
        unitPrice: item.item_price || 0,
        taxRate: item.taxRate || 18,
        cgstAmount: (item.tax_amount || 0) / 2,
        sgstAmount: (item.tax_amount || 0) / 2,
        igstAmount: 0,
        totalAmount: item.total_price || 0
      })),
      summary: {
        grandTotal: order.total_amount || 0
      },
      isPosOrder: true
    }));

    // Combine invoices and formatted POS orders
    const combined = [...invoices, ...formattedOrders];
    res.status(200).json({ success: true, data: combined });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: false });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, shopId: req.user._id, isDeleted: false },
      req.body,
      { new: true }
    );
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    await writeAuditLog(req.user._id, req.user._id, 'UPDATE_INVOICE', { invoiceNumber: invoice.invoiceNumber });
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, shopId: req.user._id },
      { isDeleted: true },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    await writeAuditLog(req.user._id, req.user._id, 'DELETE_INVOICE', { invoiceNumber: invoice.invoiceNumber });
    res.status(200).json({ success: true, message: 'Invoice soft-deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getInvoicePDF = async (req, res) => {
  try {
    const User = require('../models/userModel');
    const Order = require('../models/orderModel');

    let invoice = await Invoice.findOne({ _id: req.params.id }).populate('shopId').lean();

    if (!invoice) {
      // Check if it's a POS order from Order collection
      const order = await Order.findById(req.params.id).lean();
      if (order) {
        const shop = await User.findById(order.user_id).lean();
        invoice = {
          _id: order._id,
          invoiceNumber: order.order_no || `POS-${order._id}`,
          date: order.order_date || order.createdAt,
          customerDetails: {
            name: order.customer_name || 'Walk-in Customer',
            phone: order.customer_phone || '',
            billingAddress: '',
            shippingAddress: '',
            gstin: '',
            state: shop?.state || 'Gujarat'
          },
          items: (order.order_items || []).map(item => ({
            name: item.item_name || '',
            hsnCode: item.hsnCode || 'General',
            quantity: item.quantity || 1,
            rate: item.item_price || 0,
            discount: 0,
            taxableAmount: item.total_price || 0,
            gstPercentage: item.taxRate || 18,
            cgst: (item.tax_amount || 0) / 2,
            sgst: (item.tax_amount || 0) / 2,
            igst: 0,
            finalAmount: item.total_price || 0
          })),
          summary: {
            taxableValue: order.sub_total || order.total_amount || 0,
            cgstTotal: (order.tax_amount || 0) / 2,
            sgstTotal: (order.tax_amount || 0) / 2,
            igstTotal: 0,
            grandTotal: order.total_amount || 0
          },
          amountDue: 0,
          shopId: shop
        };
      }
    }

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    let shop = invoice.shopId;
    if (!shop || typeof shop !== 'object' || !shop.name) {
      shop = await User.findById(invoice.shopId || req.user._id).lean();
    }

    const pdfBuffer = await generatePDF({ invoice, shop }, 'invoice');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error('getInvoicePDF Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Credit/Debit Notes
exports.createNote = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const shopId = req.user._id;
    const body = { ...req.body, shopId };

    if (!body.noteNumber) {
      body.noteNumber = await getNextNumber(shopId, body.noteType === 'CREDIT' ? 'CreditNote' : 'DebitNote');
    }

    const note = new CreditDebitNote(body);
    await note.save({ session });

    // Inventory Adjustment rules
    if (note.noteType === 'CREDIT') {
      // Sales Return: stock increments
      await adjustCatalogStock(shopId, note.items, 1, 'Credit Note', note._id);
      
      // Ledger Entry: Debit Sales Return, Credit Accounts Receivable
      const entries = [
        { accountName: 'Sales Return', debit: note.summary.grandTotal, credit: 0 },
        { accountName: 'Accounts Receivable', debit: 0, credit: note.summary.grandTotal }
      ];
      await postLedgerEntry(shopId, note.date, 'CreditDebitNote', note._id, `Credit Note ${note.noteNumber}`, entries);
    } else {
      // Purchase Return: stock decrements
      await adjustCatalogStock(shopId, note.items, -1, 'Debit Note', note._id);

      // Ledger Entry: Debit Accounts Payable, Credit Expenses/Return
      const entries = [
        { accountName: 'Accounts Payable', debit: note.summary.grandTotal, credit: 0 },
        { accountName: 'Expense', debit: 0, credit: note.summary.grandTotal }
      ];
      await postLedgerEntry(shopId, note.date, 'CreditDebitNote', note._id, `Debit Note ${note.noteNumber}`, entries);
    }

    await writeAuditLog(req.user._id, shopId, `CREATE_${note.noteType}_NOTE`, { noteNumber: note.noteNumber });

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getNotes = async (req, res) => {
  try {
    const filter = { shopId: req.user._id, isDeleted: false };
    const notes = await CreditDebitNote.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getNotePDF = async (req, res) => {
  try {
    const note = await CreditDebitNote.findOne({ _id: req.params.id, isDeleted: false }).populate('shopId');
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    
    const pdfBuffer = await generatePDF({ note, shop: note.shopId }, 'credit_debit_note');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Sales Orders
exports.createSalesOrder = async (req, res) => {
  try {
    const shopId = req.user._id;
    const body = { ...req.body, shopId };

    if (!body.salesOrderNumber) {
      body.salesOrderNumber = await getNextNumber(shopId, 'SalesOrder');
    }

    const salesOrder = new SalesOrder(body);
    await salesOrder.save();

    await writeAuditLog(req.user._id, shopId, 'CREATE_SALES_ORDER', { salesOrderNumber: salesOrder.salesOrderNumber });
    res.status(201).json({ success: true, data: salesOrder });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getSalesOrders = async (req, res) => {
  try {
    const filter = { shopId: req.user._id, isDeleted: false };
    const salesOrders = await SalesOrder.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: salesOrders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSalesOrderById = async (req, res) => {
  try {
    const order = await SalesOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) return res.status(404).json({ success: false, message: 'Sales order not found' });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSalesOrderPDF = async (req, res) => {
  try {
    const salesOrder = await SalesOrder.findOne({ _id: req.params.id, isDeleted: false }).populate('shopId');
    if (!salesOrder) return res.status(404).json({ success: false, message: 'Sales order not found' });
    
    const pdfBuffer = await generatePDF({ salesOrder, shop: salesOrder.shopId }, 'sales_order');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Purchase Orders
exports.createPurchaseOrder = async (req, res) => {
  try {
    const shopId = req.user._id;
    const body = { ...req.body, shopId };

    if (!body.purchaseOrderNumber) {
      body.purchaseOrderNumber = await getNextNumber(shopId, 'PurchaseOrder');
    }

    const purchaseOrder = new PurchaseOrder(body);
    await purchaseOrder.save();

    await writeAuditLog(req.user._id, shopId, 'CREATE_PURCHASE_ORDER', { purchaseOrderNumber: purchaseOrder.purchaseOrderNumber });
    res.status(201).json({ success: true, data: purchaseOrder });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getPurchaseOrders = async (req, res) => {
  try {
    const filter = { shopId: req.user._id, isDeleted: false };
    const purchaseOrders = await PurchaseOrder.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: purchaseOrders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPurchaseOrderById = async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) return res.status(404).json({ success: false, message: 'Purchase order not found' });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPurchaseOrderPDF = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findOne({ _id: req.params.id, isDeleted: false }).populate('shopId');
    if (!purchaseOrder) return res.status(404).json({ success: false, message: 'Purchase order not found' });
    
    const pdfBuffer = await generatePDF({ purchaseOrder, shop: purchaseOrder.shopId }, 'purchase_order');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Purchase Order Stock Receipt (Goods Receipt) Completion & Conversion to Purchase Invoice
exports.receivePurchaseItems = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { itemsReceived } = req.body; // e.g. [{ name: 'MSI', quantity: 1 }]
    const po = await PurchaseOrder.findOne({ _id: req.params.id, shopId: req.user._id, isDeleted: false });
    if (!po) return res.status(404).json({ success: false, message: 'Purchase order not found' });

    // Update received counters
    po.items.forEach(item => {
      const match = itemsReceived.find(r => r.name.toLowerCase() === item.name.toLowerCase());
      if (match) {
        item.receivedQuantity = Math.min(item.quantity, item.receivedQuantity + Number(match.quantity));
      }
    });

    // Check if fully received
    const isCompleted = po.items.every(i => i.receivedQuantity >= i.quantity);
    po.status = isCompleted ? 'Completed' : 'Received';
    await po.save({ session });

    // Auto stock update only after Goods Receipt
    await adjustCatalogStock(req.user._id, itemsReceived, 1, 'Goods Receipt', po._id);

    // Write double-entry journal entry for Purchase
    const subTotal = itemsReceived.reduce((sum, i) => sum + (i.quantity * i.price), 0);
    const tax = subTotal * 0.18; // Default 18% assumption for ledger
    const total = subTotal + tax;
    
    const entries = [
      { accountName: 'Purchases', debit: parseFloat(subTotal.toFixed(2)), credit: 0 },
      { accountName: 'GST Input', debit: parseFloat(tax.toFixed(2)), credit: 0 },
      { accountName: 'Accounts Payable', debit: 0, credit: parseFloat(total.toFixed(2)) }
    ];
    await postLedgerEntry(req.user._id, new Date(), 'PurchaseOrder', po._id, `Goods Receipt PO ${po.purchaseOrderNumber}`, entries);

    await writeAuditLog(req.user._id, req.user._id, 'RECEIVE_GOODS_PO', { purchaseOrderNumber: po.purchaseOrderNumber });

    await session.commitTransaction();
    session.endSession();
    res.json({ success: true, data: po });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const po = await PurchaseOrder.findOneAndUpdate(
      { _id: req.params.id, shopId: req.user._id, isDeleted: false },
      { status },
      { new: true }
    );
    if (!po) return res.status(404).json({ success: false, message: 'Purchase order not found' });

    await writeAuditLog(req.user._id, req.user._id, 'UPDATE_PO_STATUS', { purchaseOrderNumber: po.purchaseOrderNumber, status });
    res.status(200).json({ success: true, data: po });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Quotation Controllers
exports.createQuotation = async (req, res) => {
  try {
    const shopId = req.user._id;
    const body = { ...req.body, shopId };
    const quotation = new Quotation(body);
    await quotation.save();
    res.status(201).json({ success: true, data: quotation });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getQuotations = async (req, res) => {
  try {
    const filter = { shopId: req.user._id, isDeleted: false };
    const quotations = await Quotation.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: quotations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, isDeleted: false });
    if (!quotation) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getQuotationPDF = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, isDeleted: false }).populate('shopId');
    if (!quotation) return res.status(404).json({ success: false, message: 'Not found' });
    
    const pdfBuffer = await generatePDF({ quotation, shop: quotation.shopId }, 'quotation');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GST Reports aggregations
exports.getGSTReports = async (req, res) => {
  try {
    const shopId = new mongoose.Types.ObjectId(req.user._id);

    // GSTR-1 Invoices
    const sales = await Invoice.find({ shopId, isDeleted: false }).lean();
    
    // GSTR-2 Purchases (from Goods Receipt logs or simulated Purchase Invoices)
    const purchases = await PurchaseOrder.find({ shopId, isDeleted: false, status: { $in: ['Received', 'Completed'] } }).lean();

    // HSN Summary
    const hsnSummary = {};
    sales.forEach(inv => {
      inv.items.forEach(item => {
        const code = item.hsnCode || 'General';
        if (!hsnSummary[code]) {
          hsnSummary[code] = { hsn: code, quantity: 0, taxableValue: 0, taxRate: item.gstPercentage, cgst: 0, sgst: 0, igst: 0, total: 0 };
        }
        hsnSummary[code].quantity += item.quantity;
        hsnSummary[code].taxableValue += item.taxableAmount;
        hsnSummary[code].cgst += item.cgst || 0;
        hsnSummary[code].sgst += item.sgst || 0;
        hsnSummary[code].igst += item.igst || 0;
        hsnSummary[code].total += item.finalAmount;
      });
    });

    // GST Summary collected vs paid
    let totalCollectedCGST = 0;
    let totalCollectedSGST = 0;
    let totalCollectedIGST = 0;
    sales.forEach(inv => {
      totalCollectedCGST += inv.summary.cgstTotal || 0;
      totalCollectedSGST += inv.summary.sgstTotal || 0;
      totalCollectedIGST += inv.summary.igstTotal || 0;
    });

    let totalPaidCGST = 0;
    let totalPaidSGST = 0;
    let totalPaidIGST = 0;
    purchases.forEach(po => {
      totalPaidCGST += po.summary.totalCGST || 0;
      totalPaidSGST += po.summary.totalSGST || 0;
      totalPaidIGST += po.summary.totalIGST || 0;
    });

    // Outstanding customer/supplier accounts receivables
    const customerReceivable = sales.reduce((sum, inv) => sum + (inv.amountDue || 0), 0);

    res.json({
      success: true,
      data: {
        gstr1: sales.map(s => ({ invoiceNumber: s.invoiceNumber, customerName: s.customerDetails.name, grandTotal: s.summary.grandTotal, cgst: s.summary.cgstTotal, sgst: s.summary.sgstTotal, igst: s.summary.igstTotal })),
        gstr2: purchases.map(p => ({ purchaseOrderNumber: p.purchaseOrderNumber, supplierName: p.vendorDetails.name, grandTotal: p.summary.grandTotal, cgst: p.summary.totalCGST, sgst: p.summary.totalSGST, igst: p.summary.totalIGST })),
        hsnSummary: Object.values(hsnSummary),
        gstSummary: {
          collected: { cgst: totalCollectedCGST, sgst: totalCollectedSGST, igst: totalCollectedIGST },
          paid: { cgst: totalPaidCGST, sgst: totalPaidSGST, igst: totalPaidIGST },
        },
        outstanding: {
          receivable: customerReceivable,
          payable: 0 // Mock payable total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
