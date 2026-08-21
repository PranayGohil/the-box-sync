const {
  Quotation,
  SalesOrder,
  DeliveryChallan,
  Invoice,
  SalesReturn,
  CreditNote,
  PurchaseOrder,
  GoodsReceipt,
  PurchaseBill,
  PurchaseReturn,
  DebitNote
} = require('../models');
const SequenceService = require('./SequenceService');
const StockService = require('./StockService');
const AccountingService = require('./AccountingService');

class DocConversionService {
  /**
   * Convert Quotation -> Sales Order
   */
  static async convertQuotationToSalesOrder(businessId, quotationId, financialYear, userId) {
    const quote = await Quotation.findOne({ _id: quotationId, businessId });
    if (!quote) throw new Error('Quotation not found');
    if (quote.status === 'converted') throw new Error('Quotation has already been converted');

    const orderNo = await SequenceService.getNextDocumentNumber(businessId, 'sales_order', financialYear, quote.branchId);

    const salesOrder = await SalesOrder.create({
      businessId,
      branchId: quote.branchId,
      orderNo,
      date: new Date(),
      deliveryDate: quote.validUntil,
      customerId: quote.customerId,
      customerNameSnapshot: quote.customerNameSnapshot,
      customerGSTINSnapshot: quote.customerGSTINSnapshot,
      billingAddressSnapshot: quote.billingAddressSnapshot,
      shippingAddressSnapshot: quote.shippingAddressSnapshot,
      placeOfSupply: quote.placeOfSupply,
      isInterState: quote.isInterState,
      sourceDocumentId: quote._id,
      items: quote.items,
      subtotal: quote.subtotal,
      totalDiscount: quote.totalDiscount,
      taxableAmount: quote.taxableAmount,
      cgstTotal: quote.cgstTotal,
      sgstTotal: quote.sgstTotal,
      igstTotal: quote.igstTotal,
      cessTotal: quote.cessTotal,
      totalTax: quote.totalTax,
      roundOff: quote.roundOff,
      grandTotal: quote.grandTotal,
      terms: quote.terms,
      notes: quote.notes,
      status: 'confirmed',
      createdBy: userId
    });

    quote.status = 'converted';
    quote.convertedToOrderId = salesOrder._id;
    await quote.save();

    return salesOrder;
  }

  /**
   * Convert Purchase Order -> Goods Receipt (GRN)
   */
  static async convertPOToGRN(businessId, poId, warehouseId, deliveryChallanNo, vehicleNo, items, userId) {
    const po = await PurchaseOrder.findOne({ _id: poId, businessId });
    if (!po) throw new Error('Purchase Order not found');

    const grnNo = await SequenceService.getNextDocumentNumber(businessId, 'goods_receipt', '2026-27', po.branchId);

    const grn = await GoodsReceipt.create({
      businessId,
      warehouseId: warehouseId || po.warehouseId,
      grnNo,
      date: new Date(),
      purchaseOrderId: po._id,
      supplierId: po.supplierId,
      supplierNameSnapshot: po.supplierNameSnapshot,
      deliveryChallanNo,
      vehicleNo,
      items: items || po.items,
      stockAdded: true,
      status: 'received',
      receivedBy: userId
    });

    // Add stock to warehouse
    await StockService.addStock({
      businessId,
      branchId: po.branchId,
      warehouseId: warehouseId || po.warehouseId,
      items: items || po.items,
      voucherType: 'grn',
      voucherNo: grnNo,
      referenceId: grn._id,
      userId
    });

    po.status = 'completed';
    await po.save();

    return grn;
  }
}

module.exports = DocConversionService;
