const Order = require("../models/orderModel");
const User = require("../models/userModel");

// Formats a clean order receipt JSON array for Mate Tech's Bluetooth Print Android app
exports.getBluetoothPrintJson = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const user = await User.findById(order.user_id);
    if (!user) {
      return res.status(404).json({ error: "User/Restaurant not found" });
    }

    const printSettings = user.printSettings || {};
    const showLogo = printSettings.showLogo ?? true;
    const showCustomerDetails = printSettings.showCustomerDetails ?? true;
    const headerNote = printSettings.headerNote || "";
    const footerNote = printSettings.footerNote || "Thanks, Visit Again";
    const paperWidth = printSettings.paperWidth || "58mm";
    const maxContainerWidth = paperWidth === "80mm" ? "370px" : "260px";

    // Logo URL
    const host = req.get("host");
    const protocol = req.protocol;
    let logoUrl = "";
    if (showLogo && user.logo) {
      const logoPath = user.logo.startsWith("/") ? user.logo : `/${user.logo}`;
      logoUrl = `${protocol}://${host}/uploads${logoPath}`;
    }

    // Date
    const orderDate = new Date(order.order_date || order.createdAt);
    const formattedDate = orderDate
      .toLocaleString("en-IN", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      })
      .replace(",", "")
      .toUpperCase();

    // QR Code Configuration
    const addQrCode = printSettings.addQrCode ?? false;
    const qrTargetType = printSettings.qrTargetType || "feedback";
    const qrUrl = printSettings.qrUrl || "";
    const qrTitle = printSettings.qrTitle || "";
    let qrTargetUrl = "";
    let defaultQrText = "Scan Me";

    if (addQrCode) {
      if (qrTargetType === "feedback") {
        const feedbackToken = user.restaurant_token || "";
        const feedbackHome = process.env.REACT_APP_HOME_URL || "https://www.theboxsync.com/menu";
        qrTargetUrl = `${feedbackHome}/feedback.html?token=${feedbackToken}`;
        defaultQrText = "Scan to Give Feedback";
      } else if (qrTargetType === "website") {
        const resCode = user.restaurant_code || "";
        const websiteUrl = process.env.REACT_APP_WEBSITE_URL || "http://localhost:5173";
        qrTargetUrl = `${websiteUrl}/${resCode}`;
        defaultQrText = "Scan to View Menu";
      } else if (qrTargetType === "custom") {
        qrTargetUrl = qrUrl;
        defaultQrText = "Scan to Visit Us";
      }
    }

    const qrText = qrTitle || defaultQrText;
    const qrCodeUrl = (addQrCode && qrTargetUrl) ? `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrTargetUrl)}` : "";

    // Items HTML
    const itemsHTML = order.order_items.map(item => {
      const hasVariant = item.selected_variant && (item.selected_variant.size_name || item.selected_variant.extra);
      const hasAddons = Array.isArray(item.selected_addons) && item.selected_addons.filter(a => a && a.addon_name).length > 0;
      let optionsHTML = "";
      if (hasVariant || hasAddons) {
        let options = [];
        if (item.selected_variant && item.selected_variant.size_name) {
          options.push(`Size: ${item.selected_variant.size_name}`);
        }
        if (item.selected_variant && item.selected_variant.extra) {
          options.push(`(${item.selected_variant.extra})`);
        }
        if (hasAddons) {
          item.selected_addons.filter(a => a && a.addon_name).forEach(a => {
            options.push(`${a.addon_name} (+₹${a.price})`);
          });
        }
        optionsHTML = `
          <div style="font-size: 4px; color: #000; margin-top: 1px; text-align: left;">
            ${options.join(" • ")}
          </div>
        `;
      }

      return `
        <tr>
          <td style="padding: 2px 1px; text-align: left; vertical-align: top; font-size: 5px; color: #000;">
            ${item.dish_name}
            ${optionsHTML}
          </td>
          <td style="padding: 2px 1px; text-align: center; vertical-align: top; font-size: 5px; color: #000;">${item.quantity}</td>
          <td style="padding: 2px 1px; text-align: center; vertical-align: top; font-size: 5px; color: #000;">₹${item.dish_price}</td>
          <td style="padding: 2px 1px; text-align: right; vertical-align: top; font-size: 5px; color: #000;">₹${(item.dish_price * item.quantity).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const invoiceHTML = `
       <div style="width: 100%; max-width: ${maxContainerWidth}; margin: 0; padding: 2px; box-sizing: border-box; font-family: Arial, sans-serif; font-size: 6.5px; line-height: 1.2; color: #000; background: #fff;">
        <!-- Restaurant Header -->
        <div style="text-align: center; margin-bottom: 3px;">
          ${logoUrl ? `
            <div style="text-align: center; margin-bottom: 4px;">
              <img src="${logoUrl}" alt="Logo" width="60" height="60" style="max-width: 60px; max-height: 60px; object-fit: contain; display: inline-block;" />
            </div>
          ` : ""}
          <div style="margin: 0 0 2px 0; font-size: 8px; font-weight: bold; color: #000; text-transform: uppercase;">${user.name}</div>
          <p style="margin: 1px 0; font-size: 4px; color: #000;">${user.address || ""}</p>
          <p style="margin: 1px 0; font-size: 4px; color: #000;">${user.city || ""}, ${user.state || ""} - ${user.pincode || ""}</p>
          <p style="margin: 1px 0; font-size: 4px; color: #000;"><strong>Ph:</strong> ${user.mobile || ""}</p>
          ${user.gst_no ? `<p style="margin: 1px 0; font-size: 4px; color: #000;"><strong>GST:</strong> ${user.gst_no}</p>` : ""}
          ${headerNote ? `<p style="font-style: italic; margin: 3px 0 0 0; font-size: 5px; color: #000; text-align: center;">${headerNote}</p>` : ""}
        </div>

        <hr style="border: none; border-top: 1px dashed #000; margin: 4px 0;" />

        <!-- Order Info -->
        <table style="width: 100%; font-size: 5px; margin-bottom: 6px; border-collapse: collapse;">
          <tr>
            <td style="padding: 1px 0; text-align: left; color: #000; white-space: nowrap;"><strong>Bill No:</strong> ${order.order_no || order._id}</td>
            <td style="padding: 1px 0; text-align: right; color: #000; white-space: nowrap;"><strong>${order.order_type}</strong></td>
          </tr>
          <tr>
            <td style="padding: 1px 0; text-align: left; color: #000; white-space: nowrap;"><strong>Date:</strong> ${formattedDate}</td>
            <td style="padding: 1px 0; text-align: right; color: #000; white-space: nowrap;">
              ${order.table_no
        ? `<strong>Table:</strong> ${order.table_no}`
        : order.token
          ? `<strong>Token:</strong> ${order.token}`
          : ""}
            </td>
          </tr>
          ${(showCustomerDetails && order.customer_name)
        ? `<tr><td colspan="2" style="padding: 1px 0; text-align: left; color: #000;"><strong>Customer:</strong> ${order.customer_name}</td></tr>`
        : ""}
        </table>

        <!-- Items Table -->
        <table style="width: 100%; font-size: 5px; margin-bottom: 6px; border-collapse: collapse;">
          <thead>
            <tr>
               <th style="border-bottom: 1px dashed #000; padding: 2px 1px; font-weight: bold; text-align: left; color: #000;">Item</th>
              <th style="border-bottom: 1px dashed #000; padding: 2px 1px; font-weight: bold; text-align: center; width: 30px; color: #000;">Qty</th>
              <th style="border-bottom: 1px dashed #000; padding: 2px 1px; font-weight: bold; text-align: center; width: 50px; color: #000;">Price</th>
              <th style="border-bottom: 1px dashed #000; padding: 2px 1px; font-weight: bold; text-align: right; width: 60px; color: #000;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <hr style="border: none; border-top: 1px dashed #000; margin: 4px 0;" />

        <!-- Totals Table -->
        <table style="width: 100%; font-size: 5px; margin-top: 2px; border-collapse: collapse;">
          <tbody>
            <tr>
             <td style="padding: 1px 1px; text-align: right; color: #000; padding-top: 4px; white-space: nowrap;"><strong>Sub Total:</strong></td>
              <td style="padding: 1px 1px; text-align: right; color: #000; width: 80px; padding-top: 4px;"><strong>₹${parseFloat(order.sub_total || 0).toFixed(2)}</strong></td>
            </tr>

            ${order.cgst_amount > 0 ? `
              <tr>
                <td style="padding: 1px 1px; text-align: right; color: #000; white-space: nowrap;"><strong>CGST (${order.cgst_percent || 0}%):</strong></td>
                <td style="padding: 1px 1px; text-align: right; color: #000;">₹${parseFloat(order.cgst_amount).toFixed(2)}</td>
              </tr>
            ` : ""}

            ${order.sgst_amount > 0 ? `
              <tr>
                 <td style="padding: 1px 1px; text-align: right; color: #000; white-space: nowrap;"><strong>SGST (${order.sgst_percent || 0}%):</strong></td>
                <td style="padding: 1px 1px; text-align: right; color: #000;">₹${parseFloat(order.sgst_amount).toFixed(2)}</td>
              </tr>
            ` : ""}

            ${order.vat_amount > 0 ? `
              <tr>
                 <td style="padding: 1px 1px; text-align: right; color: #000; white-space: nowrap;"><strong>VAT (${order.vat_percent || 0}%):</strong></td>
                <td style="padding: 1px 1px; text-align: right; color: #000;">₹${parseFloat(order.vat_amount).toFixed(2)}</td>
              </tr>
            ` : ""}

            ${order.discount_amount > 0 ? `
              <tr>
                <td style="padding: 1px 1px; text-align: right; color: #000; white-space: nowrap;"><strong>Discount:</strong></td>
                <td style="padding: 1px 1px; text-align: right; color: #000;">-₹${parseFloat(order.discount_amount).toFixed(2)}</td>
              </tr>
            ` : ""}

            ${order.waveoff_amount > 0 ? `
              <tr>
               <td style="padding: 1px 1px; text-align: right; color: #000; white-space: nowrap;"><strong>Waveoff:</strong></td>
                <td style="padding: 1px 1px; text-align: right; color: #000;">-₹${parseFloat(order.waveoff_amount).toFixed(2)}</td>
              </tr>
            ` : ""}

            <tr>
                <td style="padding: 1px 1px; text-align: right; color: #000; border-top: 1px dashed #000; padding-top: 4px; white-space: nowrap;"><strong>Total Amount:</strong></td>
              <td style="padding: 1px 1px; text-align: right; color: #000; border-top: 1px dashed #000; padding-top: 4px;"><strong>₹${parseFloat(order.total_amount || 0).toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

          <hr style="border: none; border-top: 1px dashed #000; margin: 4px 0;" />

        ${qrCodeUrl ? `
          <div style="text-align: center; margin: 6px 0 2px 0; clear: both; display: block;">
            <img src="${qrCodeUrl}" alt="Scan QR" width="50" height="50" style="width: 50px; height: 50px; max-width: 50px; max-height: 50px; display: inline-block;" />
            <p style="font-size: 4px; font-weight: bold; margin: 2px 0 0 0; color: #000;">${qrText}</p>
          </div>
          <hr style="border: none; border-top: 1px dashed #000; margin: 4px 0;" />
        ` : ""}

         <p style="font-size: 4px; margin: 4px 0 0 0; text-align: center; color: #000;"><strong>${footerNote}</strong></p>
        <hr style="border: none; border-top: 1px dashed #000; margin: 4px 0;" />
        <div style="height: 10px; clear: both; display: block; font-size: 1px; line-height: 1px;">&nbsp;</div>
      </div>
    `;

    const printJson = [{
      type: 4, // HTML Code
      content: invoiceHTML
    }];

    const printObject = {};
    printJson.forEach((item, index) => {
      printObject[index] = item;
    });

    return res.json(printObject);
  } catch (err) {
    console.error("Bluetooth print JSON error:", err);
    return res.status(500).json({ error: "Failed to generate print layout" });
  }
};
