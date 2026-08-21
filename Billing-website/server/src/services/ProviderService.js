const qrcode = require('qrcode');

class ProviderService {
  /**
   * Generate standard UPI Payment String and QR Data URL
   * e.g. upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
   */
  static async generateUPIQRCode({ upiId, payeeName, amount, invoiceNo, businessName }) {
    if (!upiId) return null;

    const encodedName = encodeURIComponent(payeeName || businessName || 'Billing Merchant');
    const encodedNote = encodeURIComponent(`Payment for Invoice ${invoiceNo}`);
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodedName}&am=${amount}&cu=INR&tn=${encodedNote}`;

    try {
      const qrDataUrl = await qrcode.toDataURL(upiUri, {
        width: 180,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      });
      return { upiUri, qrDataUrl };
    } catch (err) {
      console.error('[QRCode Error]:', err);
      return { upiUri, qrDataUrl: null };
    }
  }

  /**
   * E-Invoice Provider Abstraction
   */
  static async generateEInvoice(invoice, business) {
    // Generates compliant IRN structure with SHA-256 simulation or provider payload
    const crypto = require('crypto');
    const rawData = `${business.gstin}${invoice.invoiceNo}${invoice.invoiceDate}${invoice.grandTotal}`;
    const irn = crypto.createHash('sha256').update(rawData).digest('hex');
    const ackNo = `1${Date.now()}`.substring(0, 15);
    const ackDate = new Date();

    const signedQRCodeData = `IRN:${irn}|GSTIN:${business.gstin}|INV:${invoice.invoiceNo}|VAL:${invoice.grandTotal}|DATE:${ackDate.toISOString()}`;
    const qrDataUrl = await qrcode.toDataURL(signedQRCodeData, { width: 180, margin: 1 });

    return {
      irn,
      ackNo,
      ackDate,
      signedQRCode: qrDataUrl,
      signedInvoice: JSON.stringify({ irn, ackNo, ackDate, invoiceNo: invoice.invoiceNo, grandTotal: invoice.grandTotal })
    };
  }

  /**
   * E-Way Bill Provider Abstraction
   */
  static async generateEWayBill(invoice, transportDetails, business) {
    const ewbNo = `3${Math.floor(10000000000 + Math.random() * 90000000000)}`;
    const ewbDate = new Date();
    const validUntil = new Date(Date.now() + (transportDetails.distance || 100) * 24 * 60 * 60 * 1000 / 100);

    return {
      ewbNo,
      ewbDate,
      validUntil,
      vehicleNo: transportDetails.vehicleNo || 'NA',
      distance: transportDetails.distance || 100,
      status: 'active'
    };
  }
}

module.exports = ProviderService;
