import { toast } from 'react-toastify';
import { getUserTaxInfo, getOrderById } from 'api/orderService';

/**
 * Generates HTML for a single counter's KOT slip optimized for thermal printing.
 */
export const printCounterBill = (ord, userData, counterName, items) => {
  const printSettings = userData?.printSettings || {};
  const showCustomerDetails = printSettings.showCustomerDetails ?? true;

  return `
    <div class="receipt-container" style="page-break-after: always;">
      <!-- Restaurant Header -->
      <div class="receipt-header">
        <h3 style="margin: 0;">${userData.name}</h3>
      </div>

      <hr class="dashed-line" />

      <!-- Counter Badge -->
      <div class="text-center" style="margin: 6px 0;">
        <span style="color: #000; font-size: 12px; font-weight: bold; display: inline-block;">
          ${counterName} Counter
        </span>
      </div>

      <hr class="dashed-line" />

      <!-- Order Info -->
      <table class="info-table">
        <tr>
          <td><strong>Bill No:</strong> ${ord.order_no || ord._id}</td>
          <td class="text-right"><strong>${ord.order_type}</strong></td>
        </tr>
        <tr>
          <td><strong>Date:</strong> ${new Date(ord.order_date).toLocaleString('en-IN', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}</td>
          <td class="text-right">
            ${ord.table_no
      ? `<strong>Table:</strong> ${ord.table_no}`
      : ord.token
        ? `<strong>Token:</strong> ${ord.token}`
        : ''}
          </td>
        </tr>
        ${(showCustomerDetails && ord.customer_name)
      ? `<tr><td colspan="2"><strong>Customer:</strong> ${ord.customer_name}</td></tr>`
      : ''}
      </table>

      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th class="text-left">Item</th>
            <th class="text-center" style="width: 40px;">Qty</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>
                ${item.dish_name}
                ${((item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra)) || (Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0)) ? `
                  <div style="font-size: 9px; color: #000; margin-top: 1px;">
                    ${item.selected_variant && item.selected_variant.size_name ? `Size: ${item.selected_variant.size_name}` : ''}${item.selected_variant && item.selected_variant.extra ? ` (${item.selected_variant.extra})` : ''}
                    ${item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra) && Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0 ? ' • ' : ''}
                    ${Array.isArray(item.selected_addons) ? item.selected_addons.filter(a => a && a.addon_name).map(addon => addon.addon_name).join(' • ') : ''}
                  </div>
                ` : ''}
              </td>
              <td class="text-center">${item.quantity}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <hr class="dashed-line" />
      <div style="height: 70px; clear: both; display: block; font-size: 1px; line-height: 1px;">&nbsp;</div>
    </div>
  `;
};

/**
 * Generates HTML for the full customer-facing bill optimized for thermal printing.
 */
export const printFullBill = (ord, userData, items, subTotal) => {
  const uploadDir = process.env.REACT_APP_UPLOAD_DIR || 'http://localhost:5001/uploads';
  const printSettings = userData?.printSettings || {};

  const showLogo = printSettings.showLogo ?? true;
  const logoUrl = (showLogo && userData.logo) ? `${uploadDir}${userData.logo.startsWith('/') ? '' : '/'}${userData.logo}` : '';

  const showCustomerDetails = printSettings.showCustomerDetails ?? true;
  const headerNote = printSettings.headerNote || '';
  const footerNote = printSettings.footerNote || 'Thanks, Visit Again';

  // QR Code Configuration
  const addQrCode = printSettings.addQrCode ?? false;
  const qrTargetType = printSettings.qrTargetType || 'feedback';
  const qrUrl = printSettings.qrUrl || '';
  const qrTitle = printSettings.qrTitle || '';

  let qrTargetUrl = '';
  let defaultQrText = 'Scan Me';

  if (addQrCode) {
    if (qrTargetType === 'feedback') {
      const feedbackToken = userData.restaurant_token || '';
      const feedbackHome = process.env.REACT_APP_HOME_URL || 'https://www.theboxsync.com/menu';
      qrTargetUrl = `${feedbackHome}/feedback.html?token=${feedbackToken}`;
      defaultQrText = 'Scan to Give Feedback';
    } else if (qrTargetType === 'website') {
      const resCode = userData.restaurant_code || '';
      const websiteUrl = process.env.REACT_APP_WEBSITE_URL || 'http://localhost:5173';
      qrTargetUrl = `${websiteUrl}/${resCode}`;
      defaultQrText = 'Scan to View Menu';
    } else if (qrTargetType === 'custom') {
      qrTargetUrl = qrUrl;
      defaultQrText = 'Scan to Visit Us';
    }
  }

  const qrText = qrTitle || defaultQrText;
  const qrCodeUrl = (addQrCode && qrTargetUrl) ? `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrTargetUrl)}` : '';

  return `
    <div class="receipt-container" style="page-break-after: always;">
      <!-- Restaurant Header -->
      <div class="receipt-header">
        ${logoUrl ? `
          <div style="text-align: center; margin-bottom: 6px;">
            <img src="${logoUrl}" alt="Logo" style="max-width: 80px; max-height: 80px; object-fit: contain;" />
          </div>
        ` : ''}
        <h2>${userData.name}</h2>
        <p>${userData.address}</p>
        <p>${userData.city}, ${userData.state} - ${userData.pincode}</p>
        <p><strong>Ph:</strong> ${userData.mobile}</p>
        ${userData.gst_no ? `<p><strong>GST:</strong> ${userData.gst_no}</p>` : ''}
        ${headerNote ? `<p style="font-style: italic; margin: 4px 0 0 0; font-size: 10px;">${headerNote}</p>` : ''}
      </div>

      <hr class="dashed-line" />

      <!-- Order Info -->
      <table class="info-table">
        <tr>
          <td><strong>Bill No:</strong> ${ord.order_no || ord._id}</td>
          <td class="text-right"><strong>${ord.order_type}</strong></td>
        </tr>
        <tr>
          <td><strong>Date:</strong> ${new Date(ord.order_date).toLocaleString('en-IN', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}</td>
          <td class="text-right">
            ${ord.table_no
      ? `<strong>Table:</strong> ${ord.table_no}`
      : ord.token
        ? `<strong>Token:</strong> ${ord.token}`
        : ''}
          </td>
        </tr>
        ${(showCustomerDetails && ord.customer_name)
      ? `<tr><td colspan="2"><strong>Customer:</strong> ${ord.customer_name}</td></tr>`
      : ''}
      </table>

      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th class="text-left">Item</th>
            <th class="text-center" style="width: 30px;">Qty</th>
            <th class="text-center" style="width: 50px;">Price</th>
            <th class="text-right" style="width: 60px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>
                ${item.dish_name}
                ${((item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra)) || (Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0)) ? `
                  <div style="font-size: 9px; color: #000; margin-top: 1px;">
                    ${item.selected_variant && item.selected_variant.size_name ? `Size: ${item.selected_variant.size_name}` : ''}${item.selected_variant && item.selected_variant.extra ? ` (${item.selected_variant.extra})` : ''}
                    ${item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra) && Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0 ? ' • ' : ''}
                    ${Array.isArray(item.selected_addons) ? item.selected_addons.filter(a => a && a.addon_name).map(addon => `${addon.addon_name} (+₹${addon.price})`).join(' • ') : ''}
                  </div>
                ` : ''}
              </td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-center">₹${item.dish_price}</td>
              <td class="text-right">₹${(item.dish_price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <hr class="dashed-line" />

      <!-- Totals Table -->
      <table class="total-table">
        <tbody>
          <tr>
            <td class="text-right" style="padding-top: 4px;"><strong>Sub Total:</strong></td>
            <td class="text-right" style="width: 80px; padding-top: 4px;"><strong>₹${parseFloat(subTotal).toFixed(2)}</strong></td>
          </tr>

          ${ord.cgst_amount > 0 ? `
            <tr>
              <td class="text-right"><strong>CGST (${ord.cgst_percent || 0}%):</strong></td>
              <td class="text-right">₹${parseFloat(ord.cgst_amount).toFixed(2)}</td>
            </tr>
          ` : ''}

          ${ord.sgst_amount > 0 ? `
            <tr>
              <td class="text-right"><strong>SGST (${ord.sgst_percent || 0}%):</strong></td>
              <td class="text-right">₹${parseFloat(ord.sgst_amount).toFixed(2)}</td>
            </tr>
          ` : ''}

          ${ord.vat_amount > 0 ? `
            <tr>
              <td class="text-right"><strong>VAT (${ord.vat_percent || 0}%):</strong></td>
              <td class="text-right">₹${parseFloat(ord.vat_amount).toFixed(2)}</td>
            </tr>
          ` : ''}

          ${ord.discount_amount > 0 ? `
            <tr>
              <td class="text-right"><strong>Discount:</strong></td>
              <td class="text-right">-₹${parseFloat(ord.discount_amount).toFixed(2)}</td>
            </tr>
          ` : ''}

          <tr>
            <td class="text-right" style="border-top: 1px dashed #000; padding-top: 6px;"><strong>Total Amount:</strong></td>
            <td class="text-right" style="border-top: 1px dashed #000; padding-top: 6px;"><strong>₹${parseFloat(ord.total_amount).toFixed(2)}</strong></td>
          </tr>
        </tbody>
      </table>

      <hr class="dashed-line" />

      ${qrCodeUrl ? `
        <div style="text-align: center; margin: 8px 0 4px 0; clear: both; display: block;">
          <img src="${qrCodeUrl}" alt="Scan QR" style="width: 65px; height: 65px; display: inline-block;" />
          <p style="font-size: 9px; font-weight: bold; margin: 4px 0 0 0; color: #000;">${qrText}</p>
        </div>
        <hr class="dashed-line" />
      ` : ''}

      <p class="text-center" style="font-size: 11px; margin: 4px 0 0 0;"><strong>${footerNote}</strong></p>
      <hr class="dashed-line" />
      <div style="height: 70px; clear: both; display: block; font-size: 1px; line-height: 1px;">&nbsp;</div>
    </div>
  `;
};

const handleMobilePrintOption = (orderId) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  if (isMobile) {
    const useBluetooth = window.confirm(
      "Select printing method:\n\nClick 'OK' to print via Bluetooth Print app.\nClick 'Cancel' to use standard browser print."
    );
    if (useBluetooth) {
      if (!orderId) {
        toast.warning("Cannot print via Bluetooth app: Order ID is missing. Please save the order first.");
        return true;
      }
      const apiBase = process.env.REACT_APP_API || 'http://localhost:5001/api';
      const printUrl = `${apiBase}/order/bluetooth-json/${orderId}`;
      window.location.href = `my.bluetoothprint.scheme://${printUrl}`;
      return true;
    }
  }
  return false;
};

export const openPrintWindow = async (order_id, setPrinting) => {
  if (handleMobilePrintOption(order_id)) {
    if (typeof setPrinting === 'function') {
      try {
        setPrinting((prev) => {
          if (prev && typeof prev === 'object') {
            return { ...prev, [order_id]: false };
          }
          return false;
        });
      } catch (e) {
        setPrinting(false);
      }
    }
    return;
  }
  try {
    if (typeof setPrinting === 'function') {
      try {
        setPrinting((prev) => {
          if (prev && typeof prev === 'object') {
            return { ...prev, [order_id]: true };
          }
          return true;
        });
      } catch (e) {
        setPrinting(true);
      }
    }

    const token = localStorage.getItem('token');
    const [userRes, orderRes] = await Promise.all([
      getUserTaxInfo(token),
      getOrderById(order_id, token),
    ]);

    const order = orderRes.data.data;
    const userData = userRes.data;

    const groupedByCounter = {};
    order.order_items.forEach(item => {
      const counterName = item.counter || 'Default';
      if (!groupedByCounter[counterName]) groupedByCounter[counterName] = [];
      groupedByCounter[counterName].push(item);
    });

    let printFrame = document.getElementById('print-frame');
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'print-frame';
      printFrame.style.position = 'absolute';
      printFrame.style.width = '0px';
      printFrame.style.height = '0px';
      printFrame.style.border = '0px';
      printFrame.style.top = '0px';
      printFrame.style.left = '0px';
      document.body.appendChild(printFrame);
    }
    const printWindow = printFrame.contentWindow;

    const printSettings = userData?.printSettings || {};
    const paperWidth = printSettings.paperWidth || '58mm';
    const maxContainerWidth = paperWidth === '80mm' ? '390px' : '290px';

    let allBillsHTML = printFullBill(order, userData, order.order_items, order.sub_total);


    printWindow.document.write(`
      <html>
      <head>
        <title>Print Bills</title>
        <style>
          @page {
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            font-size: 11px;
            color: #000;
            background: #fff;
          }
          .receipt-container {
            width: 100%;
            max-width: ${maxContainerWidth};
            margin: 0;
            padding: 6px;
            box-sizing: border-box;
          }
          .receipt-header {
            text-align: center;
            margin-bottom: 6px;
          }
          .receipt-header h2 {
            margin: 0 0 2px 0;
            font-size: 13px;
            font-weight: bold;
          }
          .receipt-header h3 {
            margin: 0 0 2px 0;
            font-size: 12px;
            font-weight: bold;
          }
          .receipt-header p {
            margin: 1px 0;
            font-size: 10px;
          }
          .dashed-line {
            border: none;
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .info-table {
            width: 100%;
            font-size: 10px;
            margin-bottom: 6px;
          }
          .info-table td {
            padding: 1px 0;
          }
          .items-table {
            width: 100%;
            font-size: 10px;
            margin-bottom: 6px;
            border-collapse: collapse;
          }
          .items-table th {
            border-bottom: 1px dashed #000;
            padding: 3px 1px;
            font-weight: bold;
          }
          .items-table td {
            padding: 3px 1px;
            vertical-align: top;
          }
          .total-table {
            width: 100%;
            font-size: 10px;
            margin-top: 2px;
            border-collapse: collapse;
          }
          .total-table td {
            padding: 2px 1px;
          }
          .text-center {
            text-align: center;
          }
          .text-right {
            text-align: right;
          }
          .text-left {
            text-align: left;
          }
          @media print {
            body {
              width: 100%;
            }
            .receipt-container {
              max-width: 100% !important;
              padding: 0 6px 0 6px !important;
              margin: 0 0 70px 0 !important;
              border: none !important;
            }
          }
        </style>
        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 100);
          };
        </script>
      </head>
      <body>${allBillsHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  } catch (err) {
    console.error('Print error:', err);
    toast.error('Failed to print bills');
  } finally {
    if (typeof setPrinting === 'function') {
      try {
        setPrinting((prev) => {
          if (prev && typeof prev === 'object') {
            return { ...prev, [order_id]: false };
          }
          return false;
        });
      } catch (e) {
        setPrinting(false);
      }
    }
  }
};

/**
 * Prints a full bill directly from the live PaymentModal state
 * without requiring the order to be saved first.
 */
export const printModalBill = async (liveData, setPrinting) => {
  const { paymentData, orderItems, customerInfo, orderType, orderId, orderNo } = liveData;
  try {
    setPrinting(true);

    const token = localStorage.getItem('token');
    const userRes = await getUserTaxInfo(token);
    const userData = userRes.data;

    // Build an ord-compatible object from live state
    const ord = {
      _id: orderId || null,
      order_no: orderNo || (orderId ? `#${orderId.slice(-6).toUpperCase()}` : 'Preview'),
      order_type: orderType || 'Order',
      order_date: new Date().toISOString(),
      customer_name: customerInfo?.name || '',
      table_no: customerInfo?.tableNo || null,
      token: customerInfo?.token || null,
      cgst_percent: parseFloat(paymentData.cgstPercent) || 0,
      sgst_percent: parseFloat(paymentData.sgstPercent) || 0,
      vat_percent: parseFloat(paymentData.vatPercent) || 0,
      cgst_amount: parseFloat(paymentData.cgstAmount) || 0,
      sgst_amount: parseFloat(paymentData.sgstAmount) || 0,
      vat_amount: parseFloat(paymentData.vatAmount) || 0,
      discount_amount: parseFloat(paymentData.discountAmount) || 0,
      waveoff_amount: parseFloat(paymentData.waveoffAmount) || 0,
      sub_total: parseFloat(paymentData.subTotal) || 0,
      total_amount: parseFloat(paymentData.total) || 0,
      paid_amount: parseFloat(paymentData.paidAmount) || 0,
      payment_type: paymentData.paymentType || 'Cash',
    };

    let printFrame = document.getElementById('print-frame');
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'print-frame';
      printFrame.style.position = 'absolute';
      printFrame.style.width = '0px';
      printFrame.style.height = '0px';
      printFrame.style.border = '0px';
      printFrame.style.top = '0px';
      printFrame.style.left = '0px';
      document.body.appendChild(printFrame);
    }
    const printWindow = printFrame.contentWindow;

    const printSettings = userData?.printSettings || {};
    const paperWidth = printSettings.paperWidth || '58mm';
    const maxContainerWidth = paperWidth === '80mm' ? '390px' : '290px';

    const billHTML = printFullBill(ord, userData, orderItems, ord.sub_total);

    printWindow.document.write(`
      <html>
      <head>
        <title>Print Bill</title>
        <style>
          @page {
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            font-size: 11px;
            color: #000;
            background: #fff;
          }
          .receipt-container {
            width: 100%;
            max-width: ${maxContainerWidth};
            margin: 0;
            padding: 6px;
            box-sizing: border-box;
          }
          .receipt-header {
            text-align: center;
            margin-bottom: 6px;
          }
          .receipt-header h2 {
            margin: 0 0 2px 0;
            font-size: 13px;
            font-weight: bold;
          }
          .receipt-header h3 {
            margin: 0 0 2px 0;
            font-size: 12px;
            font-weight: bold;
          }
          .receipt-header p {
            margin: 1px 0;
            font-size: 10px;
          }
          .dashed-line {
            border: none;
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .info-table {
            width: 100%;
            font-size: 10px;
            margin-bottom: 6px;
          }
          .info-table td {
            padding: 1px 0;
          }
          .items-table {
            width: 100%;
            font-size: 10px;
            margin-bottom: 6px;
            border-collapse: collapse;
          }
          .items-table th {
            border-bottom: 1px dashed #000;
            padding: 3px 1px;
            font-weight: bold;
          }
          .items-table td {
            padding: 3px 1px;
            vertical-align: top;
          }
          .total-table {
            width: 100%;
            font-size: 10px;
            margin-top: 2px;
            border-collapse: collapse;
          }
          .total-table td {
            padding: 2px 1px;
          }
          .text-center {
            text-align: center;
          }
          .text-right {
            text-align: right;
          }
          .text-left {
            text-align: left;
          }
          @media print {
            body {
              width: 100%;
            }
            .receipt-container {
              max-width: 100% !important;
              padding: 0 6px 0 6px !important;
              margin: 0 0 70px 0 !important;
              border: none !important;
            }
          }
        </style>
        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 100);
          };
        </script>
      </head>
      <body>${billHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  } catch (err) {
    console.error('Print error:', err);
    toast.error('Failed to print bill');
  } finally {
    setPrinting(false);
  }
};

/**
 * Prints a KOT slip from in-memory items (no API call) optimized for thermal printing.
 */
export const printKOTSlip = (slipData, userData, setPrinting) => {
  const { orderNo, orderType, tokenNumber, tableNo, items, kotNo, timestamp } = slipData;
  if (!items || items.length === 0) return;
  setPrinting(true);

  const groupedByCounter = {};
  items.forEach(item => {
    const counter = item.counter || 'Default';
    if (!groupedByCounter[counter]) groupedByCounter[counter] = [];
    groupedByCounter[counter].push(item);
  });

  const restaurantName = userData?.name || '';
  const printTime = new Date(timestamp || new Date()).toLocaleString('en-IN', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });

  const printSettings = userData?.printSettings || {};
  const showCustomerDetails = printSettings.showCustomerDetails ?? true;
  const paperWidth = printSettings.paperWidth || '58mm';
  const maxContainerWidth = paperWidth === '80mm' ? '390px' : '290px';

  let html = '';
  Object.entries(groupedByCounter).forEach(([counterName, counterItems]) => {
    html += `
      <div class="receipt-container" style="page-break-after:always;">
        <!-- Restaurant Header -->
        <div class="receipt-header">
          <h3 style="margin: 0;">${restaurantName}</h3>
        </div>

        <hr class="dashed-line" />

        <!-- Counter Badge -->
        <div class="text-center" style="margin: 6px 0;">
          <span style="color: #000; font-size: 12px; font-weight: bold; display: inline-block;">
            ${counterName} Counter
          </span>
        </div>
        <div class="text-center" style="font-size: 13px; font-weight: bold; margin: 4px 0;">KOT #${kotNo}</div>

        <hr class="dashed-line" />

        <!-- Order Info -->
        <table class="info-table">
          <tr>
            <td><strong>Bill No:</strong> ${orderNo || '-'}</td>
            <td class="text-right"><strong>${orderType}</strong></td>
          </tr>
          <tr>
            <td><strong>Time:</strong> ${printTime}</td>
            <td class="text-right">
              ${tableNo ? `<strong>Table:</strong> ${tableNo}` : tokenNumber ? `<strong>Token:</strong> ${tokenNumber}` : ''}
            </td>
          </tr>
        </table>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th class="text-left">Item</th>
              <th class="text-center" style="width: 40px;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${counterItems.map(item => `
              <tr>
                <td>
                  ${item.dish_name}
                  ${((item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra)) || (Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0)) ? `
                    <div style="font-size: 9px; color: #000; margin-top: 1px;">
                      ${item.selected_variant && item.selected_variant.size_name ? `Size: ${item.selected_variant.size_name}` : ''}${item.selected_variant && item.selected_variant.extra ? ` (${item.selected_variant.extra})` : ''}
                      ${item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra) && Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0 ? ' • ' : ''}
                      ${Array.isArray(item.selected_addons) ? item.selected_addons.filter(a => a && a.addon_name).map(addon => addon.addon_name).join(' • ') : ''}
                    </div>
                  ` : ''}
                  ${item.special_notes ? `<div style="font-size:10px;color:#000;font-style:italic;margin-top:1px;">Note: ${item.special_notes}</div>` : ''}
                </td>
                <td class="text-center">${item.quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <hr class="dashed-line" />
        <div class="text-center" style="font-size: 10px; color: #000; margin-top: 4px;">KOT Print — ${printTime}</div>
        <hr class="dashed-line" />
        <div style="height: 70px; clear: both; display: block; font-size: 1px; line-height: 1px;">&nbsp;</div>
      </div>`;
  });

  let printFrame = document.getElementById('print-frame');
  if (!printFrame) {
    printFrame = document.createElement('iframe');
    printFrame.id = 'print-frame';
    printFrame.style.position = 'absolute';
    printFrame.style.width = '0px';
    printFrame.style.height = '0px';
    printFrame.style.border = '0px';
    printFrame.style.top = '0px';
    printFrame.style.left = '0px';
    document.body.appendChild(printFrame);
  }
  const printWindow = printFrame.contentWindow;
  printWindow.document.write(`
    <html>
    <head>
      <title>KOT #${kotNo}</title>
      <style>
        @page {
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 11px;
          color: #000;
          background: #fff;
        }
        .receipt-container {
          width: 100%;
          max-width: ${maxContainerWidth};
          margin: 0;
          padding: 6px;
          box-sizing: border-box;
        }
        .receipt-header {
          text-align: center;
          margin-bottom: 6px;
        }
        .receipt-header h2 {
          margin: 0 0 2px 0;
          font-size: 13px;
          font-weight: bold;
        }
        .receipt-header h3 {
          margin: 0 0 2px 0;
          font-size: 12px;
          font-weight: bold;
        }
        .receipt-header p {
          margin: 1px 0;
          font-size: 10px;
        }
        .dashed-line {
          border: none;
          border-top: 1px dashed #000;
          margin: 6px 0;
        }
        .info-table {
          width: 100%;
          font-size: 10px;
          margin-bottom: 6px;
        }
        .info-table td {
          padding: 1px 0;
        }
        .items-table {
          width: 100%;
          font-size: 10px;
          margin-bottom: 6px;
          border-collapse: collapse;
        }
        .items-table th {
          border-bottom: 1px dashed #000;
          padding: 3px 1px;
          font-weight: bold;
        }
        .items-table td {
          padding: 3px 1px;
          vertical-align: top;
        }
        .text-center {
          text-align: center;
        }
        .text-right {
          text-align: right;
        }
        .text-left {
          text-align: left;
        }
        @media print {
          body {
            width: 100%;
          }
          .receipt-container {
            max-width: 100% !important;
            padding: 0 6px 0 6px !important;
            margin: 0 0 70px 0 !important;
            border: none !important;
          }
        }
      </style>
      <script>
        window.onload=function(){
          window.focus();
          window.print();
          setTimeout(function(){window.close();},100);
        };
      </script>
    </head>
    <body>${html}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setPrinting(false);
};
