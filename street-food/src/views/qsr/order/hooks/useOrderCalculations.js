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
      const dValue = parseFloat(prev.discountValue) || 0;
      if (prev.discountType === 'percentage') {
        discountAmount = (subTotal * dValue) / 100;
      } else {
        discountAmount = dValue;
      }

      const total = subTotal + totalTax - discountAmount;
      const pAmount = parseFloat(prev.paidAmount) || 0;
      const waveoffAmount = pAmount > 0 ? total - pAmount : 0;

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
      const subTotal = parseFloat(prev.subTotal) || 0;
      const cgstAmount = parseFloat(prev.cgstAmount) || 0;
      const sgstAmount = parseFloat(prev.sgstAmount) || 0;
      const vatAmount = parseFloat(prev.vatAmount) || 0;
      let discountAmount = 0;
      let discountValue = '';

      // Convert existing discount to new type
      if (type === 'percentage') {
        // Convert amount to percentage
        discountValue = prev.discountAmount > 0 ? ((prev.discountAmount / subTotal) * 100).toFixed(2) : '';
        discountAmount = prev.discountAmount;
      } else {
        // Keep amount as is
        discountValue = prev.discountAmount > 0 ? prev.discountAmount : '';
        discountAmount = prev.discountAmount;
      }

      const total = subTotal + cgstAmount + sgstAmount + vatAmount - (parseFloat(discountAmount) || 0);
      const pAmount = parseFloat(prev.paidAmount) || 0;
      const waveoffAmount = pAmount > 0 ? total - pAmount : 0;

      return {
        ...prev,
        discountType: type,
        discountValue,
        discountAmount: parseFloat(discountAmount || 0).toFixed(2),
        total: total.toFixed(2),
        waveoffAmount: waveoffAmount.toFixed(2),
      };
    });
  };

  // Handle discount value change
  const handleDiscountValueChange = (value) => {
    if (value === '') {
      setPaymentData((prev) => {
        const subTotal = parseFloat(prev.subTotal) || 0;
        const cgstAmount = parseFloat(prev.cgstAmount) || 0;
        const sgstAmount = parseFloat(prev.sgstAmount) || 0;
        const vatAmount = parseFloat(prev.vatAmount) || 0;
        const total = subTotal + cgstAmount + sgstAmount + vatAmount;
        const pAmount = parseFloat(prev.paidAmount) || 0;
        return {
          ...prev,
          discountValue: '',
          discountAmount: '0.00',
          total: total.toFixed(2),
          waveoffAmount: pAmount > 0 ? (total - pAmount).toFixed(2) : '0.00',
        };
      });
      return;
    }

    const dValue = parseFloat(value) || 0;
    const subTotal = parseFloat(paymentData.subTotal) || 0;
    const cgstAmount = parseFloat(paymentData.cgstAmount) || 0;
    const sgstAmount = parseFloat(paymentData.sgstAmount) || 0;
    const vatAmount = parseFloat(paymentData.vatAmount) || 0;

    let discountAmount = 0;
    if (paymentData.discountType === 'percentage') {
      const limitedValue = Math.min(dValue, 100);
      discountAmount = (subTotal * limitedValue) / 100;
      setPaymentData((prev) => {
        const total = subTotal + cgstAmount + sgstAmount + vatAmount - discountAmount;
        const pAmount = parseFloat(prev.paidAmount) || 0;
        return { ...prev, discountValue: value, discountAmount: discountAmount.toFixed(2), total: total.toFixed(2), waveoffAmount: pAmount > 0 ? (total - pAmount).toFixed(2) : '0.00' };
      });
    } else {
      const limitedValue = Math.min(dValue, subTotal);
      discountAmount = limitedValue;
      setPaymentData((prev) => {
        const total = subTotal + cgstAmount + sgstAmount + vatAmount - discountAmount;
        const pAmount = parseFloat(prev.paidAmount) || 0;
        return { ...prev, discountValue: value, discountAmount: discountAmount.toFixed(2), total: total.toFixed(2), waveoffAmount: pAmount > 0 ? (total - pAmount).toFixed(2) : '0.00' };
      });
    }
  };

  // Handle paid amount change
  const handlePaidAmountChange = (value) => {
    if (value === '') {
      setPaymentData((prev) => ({ ...prev, paidAmount: '', waveoffAmount: '0.00' }));
      return;
    }
    const pAmount = parseFloat(value) || 0;
    const total = parseFloat(paymentData.total) || 0;
    const waveoffAmount = total - pAmount;
    setPaymentData((prev) => ({ ...prev, paidAmount: value, waveoffAmount: waveoffAmount.toFixed(2) }));
  };

  return {
    handleDiscountTypeChange,
    handleDiscountValueChange,
    handlePaidAmountChange,
  };
};

export default useOrderCalculations;
