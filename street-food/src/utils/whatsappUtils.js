export const generateWhatsAppBillMessage = (order, restaurantInfo, phoneVal) => {
  if (!order) return '';

  const restaurantName = restaurantInfo?.name || 'Restaurant';
  const whatsappSettings = restaurantInfo?.whatsappBillSettings || restaurantInfo?.user?.whatsappBillSettings || {};

  const showGst = whatsappSettings?.showGst ?? true;
  const showFssai = whatsappSettings?.showFssai ?? true;
  const showCustomerDetails = whatsappSettings?.showCustomerDetails ?? true;
  const showItemizedList = whatsappSettings?.showItemizedList ?? true;
  const headerNote = whatsappSettings?.headerNote || '';
  const footerNote = whatsappSettings?.footerNote ?? 'Thank you for your visit!';

  let message = `*${restaurantName}*\n`;
  if (headerNote && headerNote.trim()) {
    message += `${headerNote.trim()}\n`;
  }
  message += `*Order Summary*\n\n`;

  if (showGst && restaurantInfo?.gst_no) {
    message += `*GSTIN:* ${restaurantInfo.gst_no}\n`;
  }
  if (showFssai && restaurantInfo?.fssai_no) {
    message += `*FSSAI No:* ${restaurantInfo.fssai_no}\n`;
  }

  if (showCustomerDetails) {
    message += `*Customer Name :* ${order.customer_name || 'Guest'}\n`;
    const contactNum = order.customer_phone || order.customer_details?.phone || '';
    message += `*Customer Contact :* ${contactNum}\n`;
  }

  message += `*Bill No:* ${order.order_no || order.id || order._id}\n`;
  message += `*Date:* ${new Date(order.order_date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })}\n\n`;

  if (Array.isArray(order.order_items) && order.order_items.length > 0) {
    message += `*Items:*\n`;
    order.order_items.forEach((item) => {
      message += `- ${item.quantity} x ${item.dish_name} - ₹${(item.dish_price * item.quantity).toFixed(2)}\n`;
    });
    message += `\n`;
  }

  message += `*Sub Total:* ₹${parseFloat(order.sub_total || 0).toFixed(2)}\n`;
  if (order.cgst_amount > 0) message += `*CGST:* ₹${parseFloat(order.cgst_amount).toFixed(2)}\n`;
  if (order.sgst_amount > 0) message += `*SGST:* ₹${parseFloat(order.sgst_amount).toFixed(2)}\n`;
  if (order.vat_amount > 0) message += `*VAT:* ₹${parseFloat(order.vat_amount).toFixed(2)}\n`;
  if (order.discount_amount > 0) message += `*Discount:* -₹${parseFloat(order.discount_amount).toFixed(2)}\n`;
  if (order.waveoff_amount > 0) message += `*Waveoff:* -₹${parseFloat(order.waveoff_amount).toFixed(2)}\n`;
  message += `*Total Amount:* ₹${parseFloat(order.total_amount || order.bill_amount || 0).toFixed(2)}\n\n`;

  if (footerNote && footerNote.trim()) {
    message += `${footerNote.trim()}`;
  }

  const encodedMessage = encodeURIComponent(message);
  let phoneNumber = phoneVal ? String(phoneVal).replace(/\D/g, '') : '';
  if (phoneNumber && phoneNumber.length === 10) {
    phoneNumber = `91${phoneNumber}`;
  }

  return phoneNumber ? `https://wa.me/${phoneNumber}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
};
