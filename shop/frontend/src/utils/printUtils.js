import { toast } from 'react-toastify';
import { getUserTaxInfo, getOrderById } from 'api/orderService';
import { isAccountingShopType } from 'constants.js';

/**
 * Generates an A4 GST Invoice HTML format mimicking a professional template.
 */
export function printA4InvoiceHTML(ord, userData, items, subTotal) {
  const uploadDir = process.env.REACT_APP_UPLOAD_DIR || 'http://localhost:5001/uploads';
  const logoUrl = userData.logo ? `${uploadDir}${userData.logo.startsWith('/') ? '' : '/'}${userData.logo}` : '';
  const printDate = new Date(ord.order_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  const invoiceNo = ord.order_no || ord._id;

  return `
    <div class="a4-invoice-container">
      <!-- Header -->
      <table style="width: 100%; margin-bottom: 20px;">
        <tr>
          <td style="width: 50%; vertical-align: top;">
            ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-width: 150px; max-height: 80px; object-fit: contain; margin-bottom: 10px;" />` : `<h1 style="color: #23b3f4; margin: 0; font-size: 28px;">${userData.name}</h1>`}
          </td>
          <td style="width: 50%; text-align: right; vertical-align: top; font-size: 11px; color: #555;">
            <p style="margin: 0 0 4px 0;">${userData.address || ''}</p>
            <p style="margin: 0 0 4px 0;">${userData.city || ''}, ${userData.state || ''} - ${userData.pincode || ''}</p>
            <p style="margin: 0 0 4px 0;"><strong>Phone:</strong> ${userData.mobile || ''}</p>
            <p style="margin: 0 0 4px 0;"><strong>Email:</strong> ${userData.email || ''}</p>
            ${userData.gst_no ? `<p style="margin: 0 0 4px 0;"><strong>GST NO:</strong> ${userData.gst_no}</p>` : ''}
          </td>
        </tr>
      </table>

      <!-- Client & Invoice Details -->
      <table style="width: 100%; margin-bottom: 20px;">
        <tr>
          <td style="width: 50%; vertical-align: top;">
            <table style="font-size: 12px;">
              <tr>
                <td style="font-weight: bold; padding-right: 10px; padding-bottom: 4px; text-align: right;">Client :</td>
                <td style="padding-bottom: 4px;">${ord.customer_name || '-'}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding-right: 10px; padding-bottom: 4px; text-align: right;">Phone No :</td>
                <td style="padding-bottom: 4px;">${ord.customer_phone || '-'}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding-right: 10px; padding-bottom: 4px; text-align: right;">Address :</td>
                <td style="padding-bottom: 4px;">${ord.customer_address || '-'}</td>
              </tr>
              ${ord.customer_gst ? `<tr>
                <td style="font-weight: bold; padding-right: 10px; padding-bottom: 4px; text-align: right;">Gst no :</td>
                <td style="padding-bottom: 4px;">${ord.customer_gst}</td>
              </tr>` : ''}
            </table>
          </td>
          <td style="width: 50%; vertical-align: top; text-align: right;">
             <table style="font-size: 12px; float: right;">
              <tr>
                <td style="font-weight: bold; padding-right: 10px; padding-bottom: 4px; text-align: right;">Date :</td>
                <td style="padding-bottom: 4px;">${printDate}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding-right: 10px; padding-bottom: 4px; text-align: right;">Invoice no :</td>
                <td style="padding-bottom: 4px;">${invoiceNo}</td>
              </tr>
             </table>
          </td>
        </tr>
      </table>

      <!-- Title -->
      <h2 style="text-align: center; margin: 10px 0 15px 0; font-size: 20px; font-weight: bold; text-transform: uppercase;">INVOICE</h2>

      <!-- Items Table -->
      <table class="a4-items-table">
        <thead>
          <tr>
            <th style="width: 8%; text-align: center;">Sr no</th>
            <th style="width: 52%; text-align: left;">Description</th>
            <th style="width: 10%; text-align: center;">Qty</th>
            <th style="width: 15%; text-align: right;">Per</th>
            <th style="width: 15%; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, index) => `
            <tr>
              <td style="text-align: center; border-right: 1px solid #000;">${index + 1}</td>
              <td style="border-right: 1px solid #000;">
                ${item.item_name}
                ${item.hsn_code ? `<br><small>HSN: ${item.hsn_code}</small>` : ''}
              </td>
              <td style="text-align: center; border-right: 1px solid #000;">${item.quantity}</td>
              <td style="text-align: right; border-right: 1px solid #000;">${parseFloat(item.item_price).toFixed(2)}</td>
              <td style="text-align: right;">${(item.item_price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
          <!-- Empty rows for spacing -->
          <tr><td style="border-right: 1px solid #000;">&nbsp;</td><td style="border-right: 1px solid #000;"></td><td style="border-right: 1px solid #000;"></td><td style="border-right: 1px solid #000;"></td><td></td></tr>
          <tr><td style="border-right: 1px solid #000;">&nbsp;</td><td style="border-right: 1px solid #000;"></td><td style="border-right: 1px solid #000;"></td><td style="border-right: 1px solid #000;"></td><td></td></tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" rowspan="5" style="border-right: 1px solid #000; vertical-align: top; padding: 0; border-top: 1px solid #000;">
              <!-- Account Details -->
              <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
                <tr><th colspan="2" style="background-color: #5bc0de; color: #fff; padding: 4px; text-align: center; border-bottom: 1px solid #000;">Account Details</th></tr>
                <tr><td style="padding: 4px; border-bottom: 1px solid #000;"><strong>Account Name:</strong></td><td style="padding: 4px; border-bottom: 1px solid #000; border-left: 1px solid #000;">${userData.name || '-'}</td></tr>
                <tr><td style="padding: 4px; border-bottom: 1px solid #000;"><strong>Account Number:</strong></td><td style="padding: 4px; border-bottom: 1px solid #000; border-left: 1px solid #000;">-</td></tr>
                <tr><td style="padding: 4px; border-bottom: 1px solid #000;"><strong>Bank Name:</strong></td><td style="padding: 4px; border-bottom: 1px solid #000; border-left: 1px solid #000;">-</td></tr>
                <tr><td style="padding: 4px; border-bottom: 1px solid #000;"><strong>IFSC Code:</strong></td><td style="padding: 4px; border-bottom: 1px solid #000; border-left: 1px solid #000;">-</td></tr>
                <tr><td style="padding: 4px;"><strong>PAN NO:</strong></td><td style="padding: 4px; border-left: 1px solid #000;">${userData.pan_no || '-'}</td></tr>
              </table>
            </td>
            <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; padding: 4px 6px;">Sub Total</td>
            <td style="text-align: right; border-top: 1px solid #000; border-left: 1px solid #000; padding: 4px 6px;">${parseFloat(subTotal).toFixed(2)}</td>
          </tr>
          ${ord.cgst_amount > 0 ? `
          <tr>
            <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; padding: 4px 6px;">CGST @ ${ord.cgst_percent}%</td>
            <td style="text-align: right; border-top: 1px solid #000; border-left: 1px solid #000; padding: 4px 6px;">${parseFloat(ord.cgst_amount).toFixed(2)}</td>
          </tr>
          ` : ''}
          ${ord.sgst_amount > 0 ? `
          <tr>
            <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; padding: 4px 6px;">SGST @ ${ord.sgst_percent}%</td>
            <td style="text-align: right; border-top: 1px solid #000; border-left: 1px solid #000; padding: 4px 6px;">${parseFloat(ord.sgst_amount).toFixed(2)}</td>
          </tr>
          ` : ''}
          ${ord.discount_amount > 0 ? `
          <tr>
            <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; padding: 4px 6px;">Discount</td>
            <td style="text-align: right; border-top: 1px solid #000; border-left: 1px solid #000; padding: 4px 6px;">-${parseFloat(ord.discount_amount).toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px;">Total</td>
            <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; border-left: 1px solid #000; border-bottom: 1px solid #000; padding: 6px;">${parseFloat(ord.total_amount).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Signatures -->
      <table style="width: 100%; margin-top: 20px;">
        <tr>
          <td style="width: 50%; vertical-align: bottom;">
            <div style="width: 250px; border: 1px solid #000; height: 80px; padding: 5px; font-size: 11px;">
              Receiver's Signature
            </div>
          </td>
          <td style="width: 50%; text-align: right; vertical-align: bottom;">
            <p style="margin: 0 0 40px 0; font-size: 12px; font-weight: bold;">For, ${userData.name}</p>
            <p style="margin: 0; font-size: 12px; font-weight: bold; border-top: 1px solid #000; display: inline-block; padding-top: 4px;">(AUTHORIZED SIGNATORY)</p>
          </td>
        </tr>
      </table>

      <div style="margin-top: 30px; border-top: 2px solid #5bc0de; background-color: #d9edf7; padding: 8px; text-align: center; font-size: 10px;">
        ${userData.address || ''}, ${userData.city || ''} | Phone: ${userData.mobile || ''}
      </div>
    </div>
  `;
}

/**
 * Generates an A4 Quotation HTML format mimicking a professional template.
 */
export function printA4QuotationHTML(ord, userData, items, subTotal) {
  const uploadDir = process.env.REACT_APP_UPLOAD_DIR || 'http://localhost:5001/uploads';
  const logoUrl = userData.logo ? `${uploadDir}${userData.logo.startsWith('/') ? '' : '/'}${userData.logo}` : '';
  const printDate = new Date(ord.order_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  const quotationNo = ord.order_no ? ord.order_no.replace('ORD', 'QT') : `QT-${Date.now().toString().slice(-6)}`;

  return `
    <div class="a4-invoice-container">
      <!-- Header -->
      <table style="width: 100%; margin-bottom: 20px;">
        <tr>
          <td style="width: 50%; vertical-align: top;">
            ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-width: 150px; max-height: 80px; object-fit: contain; margin-bottom: 10px;" />` : `<h1 style="color: #23b3f4; margin: 0; font-size: 28px;">${userData.name}</h1>`}
          </td>
          <td style="width: 50%; text-align: right; vertical-align: top; font-size: 11px; color: #555;">
            <p style="margin: 0 0 4px 0;">${userData.address || ''}</p>
            <p style="margin: 0 0 4px 0;">${userData.city || ''}, ${userData.state || ''} - ${userData.pincode || ''}</p>
            <p style="margin: 0 0 4px 0;"><strong>Phone:</strong> ${userData.mobile || ''}</p>
            <p style="margin: 0 0 4px 0;"><strong>Email:</strong> ${userData.email || ''}</p>
            ${userData.gst_no ? `<p style="margin: 0 0 4px 0;"><strong>GST NO:</strong> ${userData.gst_no}</p>` : ''}
          </td>
        </tr>
      </table>

      <!-- Client & Quotation Details -->
      <table style="width: 100%; margin-bottom: 20px;">
        <tr>
          <td style="width: 50%; vertical-align: top;">
            <table style="font-size: 12px;">
              <tr>
                <td style="font-weight: bold; padding-right: 10px; padding-bottom: 4px; text-align: right;">Client :</td>
                <td style="padding-bottom: 4px;">${ord.customer_name || '-'}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding-right: 10px; padding-bottom: 4px; text-align: right;">Phone No :</td>
                <td style="padding-bottom: 4px;">${ord.customer_phone || '-'}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding-right: 10px; padding-bottom: 4px; text-align: right;">Address :</td>
                <td style="padding-bottom: 4px;">${ord.customer_address || '-'}</td>
              </tr>
            </table>
          </td>
          <td style="width: 50%; vertical-align: top; text-align: right;">
             <table style="font-size: 12px; float: right;">
              <tr>
                <td style="font-weight: bold; padding-right: 10px; padding-bottom: 4px; text-align: right;">Date :</td>
                <td style="padding-bottom: 4px;">${printDate}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding-right: 10px; padding-bottom: 4px; text-align: right;">Quotation No :</td>
                <td style="padding-bottom: 4px;">${quotationNo}</td>
              </tr>
             </table>
          </td>
        </tr>
      </table>

      <!-- Title -->
      <h2 style="text-align: center; margin: 10px 0 15px 0; font-size: 20px; font-weight: bold; text-transform: uppercase;">QUOTATION</h2>

      <!-- Items Table -->
      <table class="a4-items-table">
        <thead>
          <tr>
            <th style="width: 8%; text-align: center;">Sr no</th>
            <th style="width: 52%; text-align: left;">Description</th>
            <th style="width: 10%; text-align: center;">Qty</th>
            <th style="width: 15%; text-align: right;">Rate</th>
            <th style="width: 15%; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, index) => `
            <tr>
              <td style="text-align: center; border-right: 1px solid #000;">${index + 1}</td>
              <td style="border-right: 1px solid #000;">
                ${item.item_name}
                ${item.hsn_code ? `<br><small>HSN: ${item.hsn_code}</small>` : ''}
              </td>
              <td style="text-align: center; border-right: 1px solid #000;">${item.quantity}</td>
              <td style="text-align: right; border-right: 1px solid #000;">${parseFloat(item.item_price).toFixed(2)}</td>
              <td style="text-align: right;">${(item.item_price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr><td style="border-right: 1px solid #000;">&nbsp;</td><td style="border-right: 1px solid #000;"></td><td style="border-right: 1px solid #000;"></td><td style="border-right: 1px solid #000;"></td><td></td></tr>
          <tr><td style="border-right: 1px solid #000;">&nbsp;</td><td style="border-right: 1px solid #000;"></td><td style="border-right: 1px solid #000;"></td><td style="border-right: 1px solid #000;"></td><td></td></tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" rowspan="5" style="border-right: 1px solid #000; vertical-align: top; padding: 10px; border-top: 1px solid #000; font-size: 11px;">
              <strong>Terms & Conditions:</strong>
              <ul style="margin: 4px 0 0 15px; padding: 0;">
                <li>This quotation is valid for 15 days from the date of issue.</li>
                <li>Prices are subject to change without prior notice.</li>
                <li>Delivery time depends on stock availability.</li>
              </ul>
            </td>
            <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; padding: 4px 6px;">Sub Total</td>
            <td style="text-align: right; border-top: 1px solid #000; border-left: 1px solid #000; padding: 4px 6px;">${parseFloat(subTotal).toFixed(2)}</td>
          </tr>
          ${ord.cgst_amount > 0 ? `
          <tr>
            <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; padding: 4px 6px;">CGST @ ${ord.cgst_percent}%</td>
            <td style="text-align: right; border-top: 1px solid #000; border-left: 1px solid #000; padding: 4px 6px;">${parseFloat(ord.cgst_amount).toFixed(2)}</td>
          </tr>
          ` : ''}
          ${ord.sgst_amount > 0 ? `
          <tr>
            <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; padding: 4px 6px;">SGST @ ${ord.sgst_percent}%</td>
            <td style="text-align: right; border-top: 1px solid #000; border-left: 1px solid #000; padding: 4px 6px;">${parseFloat(ord.sgst_amount).toFixed(2)}</td>
          </tr>
          ` : ''}
          ${ord.discount_amount > 0 ? `
          <tr>
            <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; padding: 4px 6px;">Discount</td>
            <td style="text-align: right; border-top: 1px solid #000; border-left: 1px solid #000; padding: 4px 6px;">-${parseFloat(ord.discount_amount).toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px;">Estimated Total</td>
            <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; border-left: 1px solid #000; border-bottom: 1px solid #000; padding: 6px;">${parseFloat(ord.total_amount).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Signatures -->
      <table style="width: 100%; margin-top: 20px;">
        <tr>
          <td style="width: 50%; vertical-align: bottom;">
            <div style="width: 250px; border: 1px solid #000; height: 80px; padding: 5px; font-size: 11px;">
              Client Acceptance Signature
            </div>
          </td>
          <td style="width: 50%; text-align: right; vertical-align: bottom;">
            <p style="margin: 0 0 40px 0; font-size: 12px; font-weight: bold;">For, ${userData.name}</p>
            <p style="margin: 0; font-size: 12px; font-weight: bold; border-top: 1px solid #000; display: inline-block; padding-top: 4px;">(AUTHORIZED SIGNATORY)</p>
          </td>
        </tr>
      </table>

      <div style="margin-top: 30px; border-top: 2px solid #5bc0de; background-color: #d9edf7; padding: 8px; text-align: center; font-size: 10px;">
        ${userData.address || ''}, ${userData.city || ''} | Phone: ${userData.mobile || ''}
      </div>
    </div>
  `;
}

export const printModalA4Quotation = async (liveData, setPrinting) => {
  const { paymentData, orderItems, customerInfo, orderType, orderId, orderNo } = liveData;
  try {
    setPrinting(true);

    const token = localStorage.getItem('token');
    const userRes = await getUserTaxInfo(token);
    const userData = userRes.data;

    const ord = {
      _id: orderId || null,
      order_no: orderNo || (orderId ? `#${orderId.slice(-6).toUpperCase()}` : 'Preview'),
      order_type: orderType || 'Order',
      order_date: new Date().toISOString(),
      customer_name: customerInfo?.name || '',
      customer_phone: customerInfo?.phone || '',
      customer_address: customerInfo?.address || '',
      customer_gst: customerInfo?.gst_no || '',
      cgst_percent: parseFloat(paymentData?.cgstPercent) || 0,
      sgst_percent: parseFloat(paymentData?.sgstPercent) || 0,
      vat_percent: parseFloat(paymentData?.vatPercent) || 0,
      cgst_amount: parseFloat(paymentData?.cgstAmount) || 0,
      sgst_amount: parseFloat(paymentData?.sgstAmount) || 0,
      vat_amount: parseFloat(paymentData?.vatAmount) || 0,
      discount_amount: parseFloat(paymentData?.discountAmount) || 0,
      sub_total: parseFloat(paymentData?.subTotal) || 0,
      total_amount: parseFloat(paymentData?.total) || 0,
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

    const quotationHTML = printA4QuotationHTML(ord, userData, orderItems, ord.sub_total);

    printWindow.document.write(`
      <html>
      <head>
        <title>Quotation</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            background: #fff;
            margin: 0;
            padding: 0;
          }
          .a4-invoice-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
          }
          .a4-items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid #000;
          }
          .a4-items-table th {
            background-color: #5bc0de;
            color: #fff;
            padding: 8px 6px;
            border: 1px solid #000;
            font-size: 13px;
          }
          .a4-items-table td {
            padding: 6px;
            font-size: 12px;
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
      <body>${quotationHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  } catch (err) {
    console.error('Print error:', err);
    toast.error('Failed to print Quotation');
  } finally {
    setPrinting(false);
  }
};

/**
 * Generates HTML for a single counter's KOT slip optimized for thermal printing.
 */
export const printCounterBill = (ord, userData, counterName, items) => {
  const printSettings = userData?.printSettings || {};
  const showCustomerDetails = printSettings.showCustomerDetails ?? true;

  return `
    <div class="receipt-container" style="page-break-after: always;">
      <!-- Shop Header -->
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
                ${item.item_name}
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
      const feedbackHome = process.env.REACT_APP_HOME_URL || 'https://www.theboxsync.com/catalog';
      qrTargetUrl = `${feedbackHome}/feedback.html?token=${feedbackToken}`;
      defaultQrText = 'Scan to Give Feedback';
    } else if (qrTargetType === 'website') {
      const resCode = userData.restaurant_code || '';
      const websiteUrl = process.env.REACT_APP_WEBSITE_URL || 'http://localhost:5173';
      qrTargetUrl = `${websiteUrl}/${resCode}`;
      defaultQrText = 'Scan to View Catalog';
    } else if (qrTargetType === 'custom') {
      qrTargetUrl = qrUrl;
      defaultQrText = 'Scan to Visit Us';
    }
  }

  const qrText = qrTitle || defaultQrText;
  const qrCodeUrl = (addQrCode && qrTargetUrl) ? `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrTargetUrl)}` : '';

  return `
    <div class="receipt-container" style="page-break-after: always;">
      <!-- Shop Header -->
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
                ${item.item_name}
                ${((item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra)) || (Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0)) ? `
                  <div style="font-size: 9px; color: #000; margin-top: 1px;">
                    ${item.selected_variant && item.selected_variant.size_name ? `Size: ${item.selected_variant.size_name}` : ''}${item.selected_variant && item.selected_variant.extra ? ` (${item.selected_variant.extra})` : ''}
                    ${item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra) && Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0 ? ' • ' : ''}
                    ${Array.isArray(item.selected_addons) ? item.selected_addons.filter(a => a && a.addon_name).map(addon => `${addon.addon_name} (+₹${addon.price})`).join(' • ') : ''}
                  </div>
                ` : ''}
              </td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-center">₹${item.item_price}</td>
              <td class="text-right">₹${(item.item_price * item.quantity).toFixed(2)}</td>
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

const showMobilePrintDialog = (orderId, onStandardPrint, onCancel, setPrinting) => {
  // Create modal container
  const modalContainer = document.createElement('div');
  modalContainer.id = 'custom-print-modal';
  modalContainer.style.position = 'fixed';
  modalContainer.style.top = '0';
  modalContainer.style.left = '0';
  modalContainer.style.width = '100vw';
  modalContainer.style.height = '100vh';
  modalContainer.style.backgroundColor = 'rgba(15, 23, 42, 0.4)';
  modalContainer.style.backdropFilter = 'blur(4px)';
  modalContainer.style.display = 'flex';
  modalContainer.style.alignItems = 'center';
  modalContainer.style.justifyContent = 'center';
  modalContainer.style.zIndex = '99999';
  modalContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  // Create modal card
  const card = document.createElement('div');
  card.style.backgroundColor = '#ffffff';
  card.style.borderRadius = '20px';
  card.style.padding = '24px';
  card.style.width = '90%';
  card.style.maxWidth = '360px';
  card.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
  card.style.marginTop = '-60px';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.animation = 'scaleUpPrint 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';

  // Animation CSS
  const styleSheet = document.createElement('style');
  styleSheet.id = 'print-modal-animation-style';
  styleSheet.innerHTML = `
    @keyframes scaleUpPrint {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(styleSheet);

  const cleanUp = () => {
    try {
      document.body.removeChild(modalContainer);
      const styleNode = document.getElementById('print-modal-animation-style');
      if (styleNode) document.head.removeChild(styleNode);
    } catch (e) {
      console.error(e);
    }
  };

  // Header Container
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.paddingBottom = '16px';
  header.style.borderBottom = '1px solid #f1f5f9';
  header.style.marginBottom = '16px';

  // Header Icon Container
  const iconContainer = document.createElement('div');
  iconContainer.style.width = '40px';
  iconContainer.style.height = '40px';
  iconContainer.style.borderRadius = '10px';
  iconContainer.style.backgroundColor = '#e3f2fd';
  iconContainer.style.color = '#2196f3';
  iconContainer.style.display = 'flex';
  iconContainer.style.alignItems = 'center';
  iconContainer.style.justifyContent = 'center';
  iconContainer.style.marginRight = '12px';
  iconContainer.style.flexShrink = '0';
  iconContainer.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"></polyline>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
      <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
  `;

  // Header Title
  const title = document.createElement('h4');
  title.innerText = 'Select Print Option';
  title.style.margin = '0';
  title.style.fontSize = '16px';
  title.style.fontWeight = '700';
  title.style.color = '#1e293b';
  title.style.flexGrow = '1';

  // Header Close Button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  closeBtn.style.border = 'none';
  closeBtn.style.background = 'none';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.padding = '4px';
  closeBtn.style.display = 'flex';
  closeBtn.style.alignItems = 'center';
  closeBtn.style.justifyContent = 'center';
  closeBtn.style.flexShrink = '0';
  closeBtn.onclick = () => {
    cleanUp();
    onCancel();
  };

  header.appendChild(iconContainer);
  header.appendChild(title);
  header.appendChild(closeBtn);

  // Description
  const desc = document.createElement('p');
  desc.innerText = 'Choose how you want to print this bill:';
  desc.style.margin = '0 0 16px 0';
  desc.style.fontSize = '14px';
  desc.style.color = '#64748b';
  desc.style.textAlign = 'left';

  // Bluetooth Option Card
  const btCard = document.createElement('div');
  btCard.style.display = 'flex';
  btCard.style.alignItems = 'center';
  btCard.style.padding = '14px';
  btCard.style.border = '1px solid #e2e8f0';
  btCard.style.borderRadius = '12px';
  btCard.style.marginBottom = '12px';
  btCard.style.cursor = 'pointer';
  btCard.style.transition = 'all 0.2s ease';
  btCard.style.textAlign = 'left';
  btCard.style.backgroundColor = '#ffffff';

  const btIconContainer = document.createElement('div');
  btIconContainer.style.width = '36px';
  btIconContainer.style.height = '36px';
  btIconContainer.style.borderRadius = '50%';
  btIconContainer.style.backgroundColor = '#e0f7fa';
  btIconContainer.style.color = '#00b8d4';
  btIconContainer.style.display = 'flex';
  btIconContainer.style.alignItems = 'center';
  btIconContainer.style.justifyContent = 'center';
  btIconContainer.style.marginRight = '12px';
  btIconContainer.style.flexShrink = '0';
  btIconContainer.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m7 7 10 10-5 5V2l5 5L7 17"></path>
    </svg>
  `;

  const btTextContainer = document.createElement('div');
  const btTitle = document.createElement('div');
  btTitle.innerText = 'Print via Bluetooth App';
  btTitle.style.fontSize = '14px';
  btTitle.style.fontWeight = '600';
  btTitle.style.color = '#334155';
  const btDesc = document.createElement('div');
  btDesc.innerText = 'Use Bluetooth thermal printer app';
  btDesc.style.fontSize = '11px';
  btDesc.style.color = '#64748b';
  btTextContainer.appendChild(btTitle);
  btTextContainer.appendChild(btDesc);

  btCard.appendChild(btIconContainer);
  btCard.appendChild(btTextContainer);

  btCard.onmouseenter = () => {
    btCard.style.borderColor = '#23b3f4';
    btCard.style.backgroundColor = '#f0f9ff';
  };
  btCard.onmouseleave = () => {
    btCard.style.borderColor = '#e2e8f0';
    btCard.style.backgroundColor = '#ffffff';
  };
  btCard.onclick = () => {
    cleanUp();
    if (!orderId) {
      toast.warning("Cannot print via Bluetooth app: Order ID is missing. Please save the order first.");
      if (typeof setPrinting === 'function') {
        try {
          setPrinting((prev) => (prev && typeof prev === 'object' ? { ...prev, [orderId]: false } : false));
        } catch (e) {
          setPrinting(false);
        }
      }
      return;
    }
    const apiBase = process.env.REACT_APP_API || 'http://localhost:5001/api';
    const printUrl = `${apiBase}/order/bluetooth-json/${orderId}`;
    window.location.href = `my.bluetoothprint.scheme://${printUrl}`;
    if (typeof setPrinting === 'function') {
      try {
        setPrinting((prev) => (prev && typeof prev === 'object' ? { ...prev, [orderId]: false } : false));
      } catch (e) {
        setPrinting(false);
      }
    }
  };

  // Standard Print Option Card
  const stdCard = document.createElement('div');
  stdCard.style.display = 'flex';
  stdCard.style.alignItems = 'center';
  stdCard.style.padding = '14px';
  stdCard.style.border = '1px solid #e2e8f0';
  stdCard.style.borderRadius = '12px';
  stdCard.style.marginBottom = '16px';
  stdCard.style.cursor = 'pointer';
  stdCard.style.transition = 'all 0.2s ease';
  stdCard.style.textAlign = 'left';
  stdCard.style.backgroundColor = '#ffffff';

  const stdIconContainer = document.createElement('div');
  stdIconContainer.style.width = '36px';
  stdIconContainer.style.height = '36px';
  stdIconContainer.style.borderRadius = '50%';
  stdIconContainer.style.backgroundColor = '#fce4ec';
  stdIconContainer.style.color = '#e91e63';
  stdIconContainer.style.display = 'flex';
  stdIconContainer.style.alignItems = 'center';
  stdIconContainer.style.justifyContent = 'center';
  stdIconContainer.style.marginRight = '12px';
  stdIconContainer.style.flexShrink = '0';
  stdIconContainer.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  `;

  const stdTextContainer = document.createElement('div');
  const stdTitle = document.createElement('div');
  stdTitle.innerText = 'Standard Print / PDF';
  stdTitle.style.fontSize = '14px';
  stdTitle.style.fontWeight = '600';
  stdTitle.style.color = '#334155';
  const stdDesc = document.createElement('div');
  stdDesc.innerText = 'Print from browser or save as PDF';
  stdDesc.style.fontSize = '11px';
  stdDesc.style.color = '#64748b';
  stdTextContainer.appendChild(stdTitle);
  stdTextContainer.appendChild(stdDesc);

  stdCard.appendChild(stdIconContainer);
  stdCard.appendChild(stdTextContainer);

  stdCard.onmouseenter = () => {
    stdCard.style.borderColor = '#23b3f4';
    stdCard.style.backgroundColor = '#f0f9ff';
  };
  stdCard.onmouseleave = () => {
    stdCard.style.borderColor = '#e2e8f0';
    stdCard.style.backgroundColor = '#ffffff';
  };
  stdCard.onclick = () => {
    cleanUp();
    onStandardPrint();
  };

  // Footer Container
  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.justifyContent = 'flex-end';
  footer.style.paddingTop = '16px';
  footer.style.borderTop = '1px solid #f1f5f9';

  // Cancel Button
  const cancelBtn = document.createElement('button');
  cancelBtn.innerText = 'Cancel';
  cancelBtn.style.backgroundColor = '#e2e8f0';
  cancelBtn.style.color = '#475569';
  cancelBtn.style.border = 'none';
  cancelBtn.style.borderRadius = '9999px';
  cancelBtn.style.padding = '10px 24px';
  cancelBtn.style.fontWeight = '600';
  cancelBtn.style.fontSize = '14px';
  cancelBtn.style.cursor = 'pointer';
  cancelBtn.style.transition = 'background-color 0.2s';
  cancelBtn.onmouseenter = () => {
    cancelBtn.style.backgroundColor = '#cbd5e1';
  };
  cancelBtn.onmouseleave = () => {
    cancelBtn.style.backgroundColor = '#e2e8f0';
  };
  cancelBtn.onclick = () => {
    cleanUp();
    onCancel();
  };

  footer.appendChild(cancelBtn);

  // Assemble Card
  card.appendChild(header);
  card.appendChild(desc);
  card.appendChild(btCard);
  card.appendChild(stdCard);
  card.appendChild(footer);
  modalContainer.appendChild(card);
  document.body.appendChild(modalContainer);
};

export const openPrintWindow = async (order_id, setPrinting) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

  const executeStandardPrint = async () => {
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

        const style = document.createElement('style');
        style.innerHTML = `
          @media print {
            body > *:not(#print-frame) {
              display: none !important;
            }
            #print-frame {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: 100% !important;
              display: block !important;
            }
          }
        `;
        document.head.appendChild(style);
      }
      const printWindow = printFrame.contentWindow;

      const printSettings = userData?.printSettings || {};
      const paperWidth = printSettings.paperWidth || '58mm';
      const maxContainerWidth = paperWidth === '80mm' ? '390px' : '290px';

      const isAccounting = isAccountingShopType(userData?.shop_type);

      let allBillsHTML = '';
      if (isAccounting) {
        allBillsHTML = printA4InvoiceHTML(order, userData, order.order_items, order.sub_total);
      } else {
        allBillsHTML = printFullBill(order, userData, order.order_items, order.sub_total);
        Object.entries(groupedByCounter).forEach(([counterName, items]) => {
          allBillsHTML += printCounterBill(order, userData, counterName, items);
        });
      }

      if (isAccounting) {
        printWindow.document.write(`
          <html>
          <head>
            <title>GST Invoice</title>
            <style>
              @page {
                size: A4;
                margin: 10mm;
              }
              body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #333;
                background: #fff;
                margin: 0;
                padding: 0;
              }
              .a4-invoice-container {
                width: 100%;
                max-width: 800px;
                margin: 0 auto;
              }
              .a4-items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                border: 1px solid #000;
              }
              .a4-items-table th {
                background-color: #5bc0de;
                color: #fff;
                padding: 8px 6px;
                border: 1px solid #000;
                font-size: 13px;
              }
              .a4-items-table td {
                padding: 6px;
                font-size: 12px;
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
      } else {
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
      }
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

  if (isMobile) {
    showMobilePrintDialog(
      order_id,
      executeStandardPrint,
      () => {
        if (typeof setPrinting === 'function') {
          try {
            setPrinting((prev) => (prev && typeof prev === 'object' ? { ...prev, [order_id]: false } : false));
          } catch (e) {
            setPrinting(false);
          }
        }
      },
      setPrinting
    );
  } else {
    await executeStandardPrint();
  }
};

;

/**
 * Prints a full bill in A4 GST Invoice format directly from the live PaymentModal state.
 */
export const printModalA4Invoice = async (liveData, setPrinting) => {
  const { paymentData, orderItems, customerInfo, orderType, orderId, orderNo } = liveData;
  try {
    setPrinting(true);

    const token = localStorage.getItem('token');
    const userRes = await getUserTaxInfo(token);
    const userData = userRes.data;

    const ord = {
      _id: orderId || null,
      order_no: orderNo || (orderId ? `#${orderId.slice(-6).toUpperCase()}` : 'Preview'),
      order_type: orderType || 'Order',
      order_date: new Date().toISOString(),
      customer_name: customerInfo?.name || '',
      customer_phone: customerInfo?.phone || '',
      customer_address: customerInfo?.address || '',
      customer_gst: customerInfo?.gst_no || '',
      table_no: customerInfo?.tableNo || null,
      token: customerInfo?.token || null,
      cgst_percent: parseFloat(paymentData.cgstPercent) || 0,
      sgst_percent: parseFloat(paymentData.sgstPercent) || 0,
      vat_percent: parseFloat(paymentData.vatPercent) || 0,
      cgst_amount: parseFloat(paymentData.cgstAmount) || 0,
      sgst_amount: parseFloat(paymentData.sgstAmount) || 0,
      vat_amount: parseFloat(paymentData.vatAmount) || 0,
      discount_amount: parseFloat(paymentData.discountAmount) || 0,
      sub_total: parseFloat(paymentData.subTotal) || 0,
      total_amount: parseFloat(paymentData.total) || 0,
      paid_amount: parseFloat(paymentData.paidAmount) || 0,
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

    const invoiceHTML = printA4InvoiceHTML(ord, userData, orderItems, ord.sub_total);

    printWindow.document.write(`
      <html>
      <head>
        <title>GST Invoice</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            background: #fff;
            margin: 0;
            padding: 0;
          }
          .a4-invoice-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
          }
          .a4-items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid #000;
          }
          .a4-items-table th {
            background-color: #5bc0de;
            color: #fff;
            padding: 8px 6px;
            border: 1px solid #000;
            font-size: 13px;
          }
          .a4-items-table td {
            padding: 6px;
            font-size: 12px;
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
      <body>${invoiceHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  } catch (err) {
    console.error('Print error:', err);
    toast.error('Failed to print GST invoice');
  } finally {
    setPrinting(false);
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
        <!-- Shop Header -->
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
                  ${item.item_name}
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
