import { useEffect } from 'react';

const useOrderCalculations = ({
  orderItems,
  taxRates,
  paymentData,
  setPaymentData,
}) => {
  // Calculate totals when order items change
  useEffect(() => {
    const subTotal = orderItems.reduce((sum, item) => sum + item.dish_price * item.quantity, 0);

    // Calculate tax amounts based on subtotal
    const cgstAmount = (subTotal * paymentData.cgstPercent) / 100;
    const sgstAmount = (subTotal * paymentData.sgstPercent) / 100;
    const vatAmount = (subTotal * paymentData.vatPercent) / 100;
    const totalTax = cgstAmount + sgstAmount + vatAmount;

    setPaymentData((prev) => {
      // Calculate discount amount based on type
      let discountAmount = 0;
      if (prev.discountType === 'percentage') {
        discountAmount = (subTotal * prev.discountValue) / 100;
      } else {
        discountAmount = prev.discountValue;
      }

      const total = subTotal + totalTax - discountAmount;
      const waveoffAmount = prev.paidAmount > 0 ? total - prev.paidAmount : 0;

      return {
        ...prev,
        subTotal: subTotal.toFixed(2),
        cgstAmount: cgstAmount.toFixed(2),
        sgstAmount: sgstAmount.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        total: total.toFixed(2),
        waveoffAmount: waveoffAmount.toFixed(2),
      };
    });
  }, [orderItems, taxRates]);

  // Handle discount type change
  const handleDiscountTypeChange = (type) => {
    setPaymentData((prev) => {
      const subTotal = parseFloat(prev.subTotal);
      const cgstAmount = parseFloat(prev.cgstAmount);
      const sgstAmount = parseFloat(prev.sgstAmount);
      const vatAmount = parseFloat(prev.vatAmount);
      let discountAmount = 0;
      let discountValue = 0;

      // Convert existing discount to new type
      if (type === 'percentage') {
        // Convert amount to percentage
        discountValue = prev.discountAmount > 0 ? ((prev.discountAmount / subTotal) * 100).toFixed(2) : 0;
        discountAmount = prev.discountAmount;
      } else {
        // Keep amount as is
        discountValue = prev.discountAmount;
        discountAmount = prev.discountAmount;
      }

      const total = subTotal + cgstAmount + sgstAmount + vatAmount - discountAmount;
      const waveoffAmount = prev.paidAmount > 0 ? total - prev.paidAmount : 0;

      return {
        ...prev,
        discountType: type,
        discountValue: parseFloat(discountValue),
        discountAmount: parseFloat(discountAmount).toFixed(2),
        total: total.toFixed(2),
        waveoffAmount: waveoffAmount.toFixed(2),
      };
    });
  };

  // Handle discount value change
  const handleDiscountValueChange = (value) => {
    const discountValue = parseFloat(value) || 0;
    const subTotal = parseFloat(paymentData.subTotal);
    const cgstAmount = parseFloat(paymentData.cgstAmount);
    const sgstAmount = parseFloat(paymentData.sgstAmount);
    const vatAmount = parseFloat(paymentData.vatAmount);

    let discountAmount = 0;
    if (paymentData.discountType === 'percentage') {
      // Limit percentage to 100%
      const limitedValue = Math.min(discountValue, 100);
      discountAmount = (subTotal * limitedValue) / 100;

      setPaymentData((prev) => {
        const total = subTotal + cgstAmount + sgstAmount + vatAmount - discountAmount;
        const waveoffAmount = prev.paidAmount > 0 ? total - prev.paidAmount : 0;

        return {
          ...prev,
          discountValue: limitedValue,
          discountAmount: discountAmount.toFixed(2),
          total: total.toFixed(2),
          waveoffAmount: waveoffAmount.toFixed(2),
        };
      });
    } else {
      // Limit amount to subtotal
      const limitedValue = Math.min(discountValue, subTotal);
      discountAmount = limitedValue;

      setPaymentData((prev) => {
        const total = subTotal + cgstAmount + sgstAmount + vatAmount - discountAmount;
        const waveoffAmount = prev.paidAmount > 0 ? total - prev.paidAmount : 0;

        return {
          ...prev,
          discountValue: limitedValue,
          discountAmount: discountAmount.toFixed(2),
          total: total.toFixed(2),
          waveoffAmount: waveoffAmount.toFixed(2),
        };
      });
    }
  };

  // Handle paid amount change
  const handlePaidAmountChange = (value) => {
    const paidAmount = parseFloat(value) || 0;
    const total = parseFloat(paymentData.total);
    const waveoffAmount = total - paidAmount;

    setPaymentData((prev) => ({
      ...prev,
      paidAmount,
      waveoffAmount: waveoffAmount.toFixed(2),
    }));
  };

  return {
    handleDiscountTypeChange,
    handleDiscountValueChange,
    handlePaidAmountChange,
  };
};

export default useOrderCalculations;
