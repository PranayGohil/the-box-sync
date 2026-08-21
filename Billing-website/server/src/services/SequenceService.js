const { Sequence } = require('../models');

class SequenceService {
  /**
   * Get the next atomic sequential document number for a given document type and financial year
   * Example output: "INV-2026-27-00001", "PO-2026-27-00001"
   */
  static async getNextDocumentNumber(businessId, documentType, financialYear, branchId = null, customPrefix = null) {
    const defaultPrefixes = {
      invoice: 'INV',
      quotation: 'QUO',
      sales_order: 'SO',
      delivery_challan: 'DC',
      sales_return: 'SR',
      credit_note: 'CN',
      purchase_order: 'PO',
      goods_receipt: 'GRN',
      purchase_bill: 'BILL',
      purchase_return: 'PR',
      debit_note: 'DN',
      payment_in: 'REC',
      payment_out: 'PAY',
      expense: 'EXP',
      journal: 'JV',
      voucher: 'VCH',
      stock_transfer: 'TRF',
      stock_adjustment: 'ADJ'
    };

    const prefix = customPrefix || defaultPrefixes[documentType] || documentType.toUpperCase();

    const sequence = await Sequence.findOneAndUpdate(
      {
        businessId,
        financialYear,
        documentType,
        branchId: branchId || null
      },
      {
        $inc: { lastSequenceNumber: 1 },
        $setOnInsert: { prefix }
      },
      {
        new: true,
        upsert: true
      }
    );

    const paddedNumber = String(sequence.lastSequenceNumber).padStart(5, '0');
    return `${prefix}-${financialYear}-${paddedNumber}`;
  }
}

module.exports = SequenceService;
