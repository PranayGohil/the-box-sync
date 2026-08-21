class TaxDeterminationService {
  /**
   * Determine GST Tax Structure (CGST+SGST vs IGST) and calculate itemized taxes
   * @param {Object} options - { supplierStateCode, customerStateCode, isInterState, isTaxInclusive, items }
   */
  static calculateItemTaxes(items, supplierStateCode, placeOfSupplyStateCode, isTaxInclusive = false) {
    const isInterState = String(supplierStateCode).trim() !== String(placeOfSupplyStateCode).trim();

    let subtotal = 0;
    let totalDiscount = 0;
    let taxableAmount = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let cessTotal = 0;

    const calculatedItems = items.map(item => {
      const quantity = Number(item.quantity) || 1;
      const rate = Number(item.rate) || 0;
      const grossAmount = quantity * rate;

      let discountAmount = 0;
      if (item.discountPercent && Number(item.discountPercent) > 0) {
        discountAmount = (grossAmount * Number(item.discountPercent)) / 100;
      } else if (item.discountAmount && Number(item.discountAmount) > 0) {
        discountAmount = Number(item.discountAmount);
      }

      const discountedAmount = Math.max(0, grossAmount - discountAmount);
      const taxRate = Number(item.taxRate) || 0;
      const cessRate = Number(item.cessRate) || 0;

      let itemTaxableValue = 0;
      let itemTaxAmount = 0;
      let itemCessAmount = 0;

      if (isTaxInclusive && taxRate > 0) {
        // Price includes tax: Taxable Value = Amount / (1 + (Rate / 100))
        itemTaxableValue = discountedAmount / (1 + (taxRate + cessRate) / 100);
        itemTaxAmount = (itemTaxableValue * taxRate) / 100;
        itemCessAmount = (itemTaxableValue * cessRate) / 100;
      } else {
        // Price excludes tax: Taxable Value = Discounted Amount
        itemTaxableValue = discountedAmount;
        itemTaxAmount = (itemTaxableValue * taxRate) / 100;
        itemCessAmount = (itemTaxableValue * cessRate) / 100;
      }

      let cgstRate = 0;
      let cgstAmount = 0;
      let sgstRate = 0;
      let sgstAmount = 0;
      let igstRate = 0;
      let igstAmount = 0;

      if (isInterState) {
        igstRate = taxRate;
        igstAmount = itemTaxAmount;
      } else {
        cgstRate = taxRate / 2;
        cgstAmount = itemTaxAmount / 2;
        sgstRate = taxRate / 2;
        sgstAmount = itemTaxAmount / 2;
      }

      const itemTotal = itemTaxableValue + itemTaxAmount + itemCessAmount;

      subtotal += grossAmount;
      totalDiscount += discountAmount;
      taxableAmount += itemTaxableValue;
      cgstTotal += cgstAmount;
      sgstTotal += sgstAmount;
      igstTotal += igstAmount;
      cessTotal += itemCessAmount;

      return {
        ...item,
        quantity,
        rate,
        discountPercent: Number(item.discountPercent) || 0,
        discountAmount: Number(discountAmount.toFixed(2)),
        taxableValue: Number(itemTaxableValue.toFixed(2)),
        taxRate,
        cgstRate,
        cgstAmount: Number(cgstAmount.toFixed(2)),
        sgstRate,
        sgstAmount: Number(sgstAmount.toFixed(2)),
        igstRate,
        igstAmount: Number(igstAmount.toFixed(2)),
        cessRate,
        cessAmount: Number(itemCessAmount.toFixed(2)),
        total: Number(itemTotal.toFixed(2))
      };
    });

    const totalTax = cgstTotal + sgstTotal + igstTotal + cessTotal;
    const rawGrandTotal = taxableAmount + totalTax;
    const roundedGrandTotal = Math.round(rawGrandTotal);
    const roundOff = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));

    return {
      items: calculatedItems,
      isInterState,
      subtotal: Number(subtotal.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      taxableAmount: Number(taxableAmount.toFixed(2)),
      cgstTotal: Number(cgstTotal.toFixed(2)),
      sgstTotal: Number(sgstTotal.toFixed(2)),
      igstTotal: Number(igstTotal.toFixed(2)),
      cessTotal: Number(cessTotal.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      roundOff,
      grandTotal: roundedGrandTotal
    };
  }

  /**
   * Calculate TDS Deduction on an Expense or Purchase
   */
  static calculateTDS(grossAmount, tdsRate) {
    if (!tdsRate || tdsRate <= 0) {
      return { tdsAmount: 0, netPayable: grossAmount };
    }
    const tdsAmount = Number(((grossAmount * tdsRate) / 100).toFixed(2));
    const netPayable = Number((grossAmount - tdsAmount).toFixed(2));
    return { tdsAmount, netPayable };
  }
}

module.exports = TaxDeterminationService;
