const {
  Invoice,
  PurchaseBill,
  Payment,
  CreditNote,
  DebitNote,
  JournalEntry,
  JournalEntryLine,
  Customer,
  Supplier,
  ChartOfAccount
} = require('../models');
const StockService = require('./StockService');

class ReversalService {
  /**
   * Cancel and Reverse a Finalized Sales Invoice
   */
  static async cancelInvoice(businessId, invoiceId, reason, userId) {
    const invoice = await Invoice.findOne({ _id: invoiceId, businessId });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'cancelled') throw new Error('Invoice is already cancelled');

    // 1. Restock goods into inventory
    await StockService.addStock({
      businessId,
      branchId: invoice.branchId,
      warehouseId: invoice.warehouseId,
      items: invoice.items,
      voucherType: 'sales_return',
      voucherNo: `CANCEL-${invoice.invoiceNo}`,
      referenceId: invoice._id,
      userId
    });

    // 2. Reverse accounting journal entries if present
    if (invoice.journalEntryId) {
      const originalEntry = await JournalEntry.findById(invoice.journalEntryId);
      if (originalEntry && !originalEntry.isReversed) {
        const originalLines = await JournalEntryLine.find({ journalEntryId: originalEntry._id });

        // Build opposite lines (Debit becomes Credit, Credit becomes Debit)
        const reversalLines = originalLines.map(line => ({
          accountId: line.accountId,
          partyType: line.partyType,
          partyId: line.partyId,
          debit: line.credit,
          credit: line.debit,
          narration: `Reversal of #${invoice.invoiceNo}: ${reason}`
        }));

        const AccountingService = require('./AccountingService');
        const reversalEntry = await AccountingService.postJournalEntry({
          businessId,
          branchId: invoice.branchId,
          financialYear: invoice.financialYear,
          voucherType: 'journal',
          voucherNo: `REV-${invoice.invoiceNo}`,
          referenceId: invoice._id,
          referenceModel: 'Invoice',
          narration: `Cancellation Reversal for Invoice #${invoice.invoiceNo} (${reason})`,
          lines: reversalLines,
          userId
        });

        originalEntry.isReversed = true;
        originalEntry.reversedByEntryId = reversalEntry._id;
        originalEntry.reversalReason = reason;
        await originalEntry.save();
      }
    } else {
      // Revert customer balance directly
      await Customer.findByIdAndUpdate(invoice.customerId, {
        $inc: { currentBalance: -invoice.grandTotal }
      });
    }

    invoice.status = 'cancelled';
    invoice.cancellationReason = reason;
    invoice.cancelledAt = new Date();
    invoice.cancelledBy = userId;
    await invoice.save();

    return invoice;
  }

  /**
   * Cancel and Reverse a Finalized Purchase Bill
   */
  static async cancelPurchaseBill(businessId, billId, reason, userId) {
    const bill = await PurchaseBill.findOne({ _id: billId, businessId });
    if (!bill) throw new Error('Purchase Bill not found');
    if (bill.status === 'cancelled') throw new Error('Bill is already cancelled');

    // 1. Deduct stock back out of warehouse
    await StockService.deductStock({
      businessId,
      branchId: bill.branchId,
      warehouseId: bill.warehouseId,
      items: bill.items,
      voucherType: 'purchase_return',
      voucherNo: `CANCEL-${bill.billNo}`,
      referenceId: bill._id,
      userId
    });

    // 2. Reverse accounting journal entries
    if (bill.journalEntryId) {
      const originalEntry = await JournalEntry.findById(bill.journalEntryId);
      if (originalEntry && !originalEntry.isReversed) {
        const originalLines = await JournalEntryLine.find({ journalEntryId: originalEntry._id });
        const reversalLines = originalLines.map(line => ({
          accountId: line.accountId,
          partyType: line.partyType,
          partyId: line.partyId,
          debit: line.credit,
          credit: line.debit,
          narration: `Reversal of Purchase Bill #${bill.billNo}`
        }));

        const AccountingService = require('./AccountingService');
        const reversalEntry = await AccountingService.postJournalEntry({
          businessId,
          branchId: bill.branchId,
          financialYear: bill.financialYear,
          voucherType: 'journal',
          voucherNo: `REV-${bill.billNo}`,
          referenceId: bill._id,
          referenceModel: 'PurchaseBill',
          narration: `Cancellation Reversal for Purchase Bill #${bill.billNo}`,
          lines: reversalLines,
          userId
        });

        originalEntry.isReversed = true;
        originalEntry.reversedByEntryId = reversalEntry._id;
        await originalEntry.save();
      }
    } else {
      await Supplier.findByIdAndUpdate(bill.supplierId, {
        $inc: { currentBalance: -bill.grandTotal }
      });
    }

    bill.status = 'cancelled';
    bill.cancellationReason = reason;
    bill.cancelledAt = new Date();
    bill.cancelledBy = userId;
    await bill.save();

    return bill;
  }
}

module.exports = ReversalService;
