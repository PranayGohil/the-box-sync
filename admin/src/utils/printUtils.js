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
