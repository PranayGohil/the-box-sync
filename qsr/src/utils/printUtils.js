import { toast } from 'react-toastify';
import { getUserTaxInfo, getOrderById } from 'api/orderService';

/**
 * Generates HTML for a single counter's KOT slip.
 */
export const printCounterBill = (ord, userData, counterName, items) => {
  return `
    <div style="page-break-after: always; font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 10px; border: 1px solid #ccc;">
      <!-- Restaurant Header -->
      <div style="text-align: center; margin-bottom: 10px;">
        <h3 style="margin: 5px;">${userData.name}</h3>
      </div>

      <hr style="border: 0.5px dashed #ccc;" />

      <!-- Counter Badge -->
      <div style="text-align: center; margin: 8px 0;">
        <span style="background: #000; color: #fff; padding: 4px 16px; border-radius: 4px; font-size: 14px; font-weight: bold;">
          ${counterName} Counter
        </span>
      </div>

      <hr style="border: 0.5px dashed #ccc;" />

      <!-- Order Info -->
      <table style="width: 100%; font-size: 12px; margin-bottom: 8px;">
        <tr>
          <td><strong>Bill No:</strong> ${ord.order_no || ord._id}</td>
          <td style="text-align: right;"><strong>${ord.order_type}</strong></td>
        </tr>
        <tr>
          <td><strong>Date:</strong> ${new Date(ord.order_date).toLocaleString()}</td>
          <td style="text-align: right;">
            ${ord.table_no
      ? `<strong>Table:</strong> ${ord.table_no}`
      : ord.token
        ? `<strong>Token:</strong> ${ord.token}`
        : ''}
          </td>
        </tr>
        ${ord.customer_name
      ? `<tr><td colspan="2"><strong>Customer:</strong> ${ord.customer_name}</td></tr>`
      : ''}
      </table>

      <!-- Items Table -->
      <table style="width: 100%; font-size: 12px; margin-bottom: 10px;">
    <thead>
          <tr>
            <th style="text-align: left; border-bottom: 1px solid #ccc;">Item</th>
            <th style="text-align: center; border-bottom: 1px solid #ccc;">Qty</th>
          </tr>
    </thead>
    <tbody>
          ${items.map(item => `
            <tr>
              <td>
                 ${item.dish_name}
                ${((item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra)) || (Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0)) ? `
                  <div style="font-size: 10px; color: #555; margin-top: 2px;">
                    ${item.selected_variant && item.selected_variant.size_name ? `Size: ${item.selected_variant.size_name}` : ''}${item.selected_variant && item.selected_variant.extra ? ` (${item.selected_variant.extra})` : ''}
                    ${item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra) && Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0 ? ' • ' : ''}
                    ${Array.isArray(item.selected_addons) ? item.selected_addons.filter(a => a && a.addon_name).map(addon => addon.addon_name).join(' • ') : ''}
                  </div>
                ` : ''}
              </td>
              <td style="text-align: center;">${item.quantity}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
};

/**
 * Generates HTML for the full customer-facing bill.
 */
export const printFullBill = (ord, userData, items, subTotal) => {
  return `
    <div style="page-break-after: always; font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 10px; border: 1px solid #ccc;">
      <!-- Restaurant Header -->
      <div style="text-align: center; margin-bottom: 10px;">
        <h2 style="margin: 5px;">${userData.name}</h2>
        <p style="margin: 0; font-size: 14px;">${userData.address}</p>
        <p style="margin: 0; font-size: 14px;">${userData.city}, ${userData.state} - ${userData.pincode}</p>
        <p style="margin: 5px; font-size: 14px;"><strong>Ph:</strong> ${userData.mobile}</p>
        ${userData.gst_no ? `<p style="font-size: 14px;"><strong>GST:</strong> ${userData.gst_no}</p>` : ''}
      </div>

      <hr style="border: 0.5px dashed #ccc;" />

      <!-- Order Info -->
      <table style="width: 100%; font-size: 14px; margin-bottom: 20px;">
        <tr>
          <td><strong>Bill No:</strong> ${ord.order_no || ord._id}</td>
          <td style="text-align: right;"><strong>${ord.order_type}</strong></td>
        </tr>
        <tr>
          <td><strong>Date:</strong> ${new Date(ord.order_date).toLocaleString()}</td>
          <td style="text-align: right;">
            ${ord.table_no
      ? `<strong>Table:</strong> ${ord.table_no}`
      : ord.token
        ? `<strong>Token:</strong> ${ord.token}`
        : ''}
          </td>
        </tr>
        ${ord.customer_name
      ? `<tr><td colspan="2"><strong>Customer:</strong> ${ord.customer_name}</td></tr>`
      : ''}
      </table>

      <!-- Items Table -->
      <table style="width: 100%; font-size: 14px; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="text-align: left; border-bottom: 1px solid #ccc;">Item</th>
            <th style="text-align: center; border-bottom: 1px solid #ccc;">Qty</th>
            <th style="text-align: center; border-bottom: 1px solid #ccc;">Price</th>
            <th style="text-align: right; border-bottom: 1px solid #ccc;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
             <tr>
              <td>
                ${item.dish_name}
                ${((item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra)) || (Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0)) ? `
                  <div style="font-size: 10px; color: #555; margin-top: 2px;">
                    ${item.selected_variant && item.selected_variant.size_name ? `Size: ${item.selected_variant.size_name}` : ''}${item.selected_variant && item.selected_variant.extra ? ` (${item.selected_variant.extra})` : ''}
                    ${item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra) && Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0 ? ' • ' : ''}
                    ${Array.isArray(item.selected_addons) ? item.selected_addons.filter(a => a && a.addon_name).map(addon => `${addon.addon_name} (+₹${addon.price})`).join(' • ') : ''}
                  </div>
                ` : ''}
              </td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: center;">₹${item.dish_price}</td>
              <td style="text-align: right;">₹${(item.dish_price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}

          <tr>
            <td colspan="3" style="text-align: right; border-top: 1px solid #ccc; padding-top: 10px;">
              <strong>Sub Total:</strong>
            </td>
            <td style="text-align: right; border-top: 1px solid #ccc; padding-top: 10px;">
              <strong>₹${parseFloat(subTotal).toFixed(2)}</strong>
            </td>
          </tr>

          ${ord.cgst_amount > 0 ? `
            <tr>
              <td colspan="3" style="text-align: right;"><strong>CGST (${ord.cgst_percent || 0}%):</strong></td>
              <td style="text-align: right;">₹${parseFloat(ord.cgst_amount).toFixed(2)}</td>
            </tr>
          ` : ''}

          ${ord.sgst_amount > 0 ? `
            <tr>
              <td colspan="3" style="text-align: right;"><strong>SGST (${ord.sgst_percent || 0}%):</strong></td>
              <td style="text-align: right;">₹${parseFloat(ord.sgst_amount).toFixed(2)}</td>
            </tr>
          ` : ''}

          ${ord.vat_amount > 0 ? `
            <tr>
              <td colspan="3" style="text-align: right;"><strong>VAT (${ord.vat_percent || 0}%):</strong></td>
              <td style="text-align: right;">₹${parseFloat(ord.vat_amount).toFixed(2)}</td>
            </tr>
          ` : ''}

          ${ord.discount_amount > 0 ? `
            <tr>
              <td colspan="3" style="text-align: right;"><strong>Discount:</strong></td>
              <td style="text-align: right;">₹${parseFloat(ord.discount_amount).toFixed(2)}</td>
            </tr>
          ` : ''}

          <tr>
            <td colspan="3" style="text-align: right; border-top: 1px solid #ccc; padding-top: 10px;">
              <strong>Total Amount:</strong>
            </td>
            <td style="text-align: right; border-top: 1px solid #ccc; padding-top: 10px;">
              <strong>₹${parseFloat(ord.total_amount).toFixed(2)}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <hr style="border: 0.5px dashed #ccc;" />
      <p style="text-align: center; font-size: 12px;"><strong>Thanks, Visit Again</strong></p>
    </div>
  `;
};

export const openPrintWindow = async (order_id, setPrinting) => {
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

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked! Please allow popups.');
      return;
    }

    let allBillsHTML = printFullBill(order, userData, order.order_items, order.sub_total);
    Object.entries(groupedByCounter).forEach(([counterName, items]) => {
      allBillsHTML += printCounterBill(order, userData, counterName, items);
    });

    printWindow.document.write(`
      <html>
      <head>
        <title>Print Bills</title>
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
 *
 * @param {object} liveData  - { paymentData, orderItems, customerInfo, orderType, orderId }
 * @param {Function} setPrinting - state setter to show loading state
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

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked! Please allow popups.');
      return;
    }

    let billHTML = printFullBill(ord, userData, orderItems, ord.sub_total);

    const groupedByCounter = {};
    orderItems.forEach(item => {
      const counterName = item.counter || 'Default';
      if (!groupedByCounter[counterName]) groupedByCounter[counterName] = [];
      groupedByCounter[counterName].push(item);
    });

    Object.entries(groupedByCounter).forEach(([counterName, items]) => {
      billHTML += printCounterBill(ord, userData, counterName, items);
    });

    printWindow.document.write(`
      <html>
      <head>
        <title>Print Bill</title>
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
 * Prints a KOT slip from in-memory items (no API call).
 * Groups items by counter field if present.
 *
 * @param {object} slipData - { orderNo, orderType, tokenNumber, tableNo, items, kotNo, timestamp }
 * @param {object} userData - { name } — restaurant name
 * @param {Function} setPrinting - loading state setter
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
  const printTime = new Date(timestamp || new Date()).toLocaleString('en-IN');

  let html = '';
  Object.entries(groupedByCounter).forEach(([counterName, counterItems]) => {
    html += `
      <div style="page-break-after:always;font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:10px;border:1px solid #ccc;">
        <div style="text-align:center;margin-bottom:8px;"><h3 style="margin:3px;">${restaurantName}</h3></div>
        <hr style="border:0.5px dashed #ccc;"/>
        <div style="text-align:center;margin:6px 0;">
          <span style="background:#000;color:#fff;padding:4px 16px;border-radius:4px;font-size:14px;font-weight:bold;">${counterName} Counter</span>
        </div>
        <div style="text-align:center;font-size:14px;font-weight:bold;margin:4px 0;">KOT #${kotNo}</div>
        <hr style="border:0.5px dashed #ccc;"/>
        <table style="width:100%;font-size:12px;margin-bottom:8px;">
          <tr><td><strong>Bill No:</strong> ${orderNo || '-'}</td><td style="text-align:right;"><strong>${orderType}</strong></td></tr>
          <tr>
            <td><strong>Time:</strong> ${printTime}</td>
            <td style="text-align:right;">${tableNo ? `<strong>Table:</strong> ${tableNo}` : tokenNumber ? `<strong>Token:</strong> ${tokenNumber}` : ''}</td>
          </tr>
        </table>
        <table style="width:100%;font-size:13px;margin-bottom:10px;">
          <thead><tr>
            <th style="text-align:left;border-bottom:1px solid #ccc;padding:3px 0;">Item</th>
            <th style="text-align:center;border-bottom:1px solid #ccc;width:40px;">Qty</th>
          </tr></thead>
          <tbody>
            ${counterItems.map(item => `
              <tr>
                <td style="padding:4px 0;">
                  ${item.dish_name}
                  ${((item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra)) || (Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0)) ? `
                    <div style="font-size: 11px; color: #555; margin-top: 2px; font-weight: bold;">
                      ${item.selected_variant && item.selected_variant.size_name ? `Size: ${item.selected_variant.size_name}` : ''}${item.selected_variant && item.selected_variant.extra ? ` (${item.selected_variant.extra})` : ''}
                      ${item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra) && Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0 ? ' • ' : ''}
                      ${Array.isArray(item.selected_addons) ? item.selected_addons.filter(a => a && a.addon_name).map(addon => addon.addon_name).join(' • ') : ''}
                    </div>
                  ` : ''}
                  ${item.special_notes ? `<div style="font-size:11px;color:#666;font-style:italic;">Note: ${item.special_notes}</div>` : ''}
                </td>
                <td style="text-align:center;font-size:16px;font-weight:bold;">${item.quantity}</td>
        </tr>`).join('')}
    </tbody>
  </table>
        <hr style="border:0.5px dashed #ccc;"/>
        <div style="text-align:center;font-size:10px;color:#999;">KOT Print — ${printTime}</div>
      </div>`;
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('Popup blocked! Please allow popups.');
    setPrinting(false);
    return;
  }
  printWindow.document.write(`
    <html><head><title>KOT #${kotNo}</title>
    <script>window.onload=function(){window.focus();window.print();setTimeout(function(){window.close();},100);};</script>
    </head><body>${html}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  setPrinting(false);
};
