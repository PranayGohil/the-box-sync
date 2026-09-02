import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const DocumentTemplate = React.forwardRef(({ document: doc, business, docType = 'quotation', template = 'modern' }, ref) => {
  if (!doc || !business) return null;

  const isClassic = template === 'classic';
  const isMinimal = template === 'minimal';
  const isProfessional = template === 'professional';
  // default is modern

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Determine doc metadata
  let docTitle = 'DOCUMENT';
  let docNoLabel = 'Doc #';
  let docNo = '';
  let dateLabel = 'Date';
  let secondaryDateLabel = '';
  let secondaryDate = '';
  let isPurchase = false;

  switch (docType) {
    case 'quotation':
      docTitle = 'QUOTATION / PRICE ESTIMATE';
      docNoLabel = 'Quotation #';
      docNo = doc.quotationNo;
      dateLabel = 'Quotation Date';
      if (doc.validUntil) {
        secondaryDateLabel = 'Valid Until';
        secondaryDate = formatDate(doc.validUntil);
      }
      break;
    case 'sales_order':
      docTitle = 'SALES ORDER';
      docNoLabel = 'Order #';
      docNo = doc.orderNo;
      dateLabel = 'Order Date';
      if (doc.deliveryDate) {
        secondaryDateLabel = 'Delivery Date';
        secondaryDate = formatDate(doc.deliveryDate);
      }
      break;
    case 'purchase_order':
      docTitle = 'PURCHASE ORDER';
      docNoLabel = 'PO #';
      docNo = doc.poNo;
      dateLabel = 'PO Date';
      isPurchase = true;
      if (doc.expectedDeliveryDate) {
        secondaryDateLabel = 'Expected Delivery';
        secondaryDate = formatDate(doc.expectedDeliveryDate);
      }
      break;
    case 'delivery_challan':
      docTitle = 'DELIVERY CHALLAN';
      docNoLabel = 'Challan #';
      docNo = doc.challanNo;
      dateLabel = 'Challan Date';
      break;
    case 'purchase_bill':
      docTitle = 'PURCHASE BILL';
      docNoLabel = 'Bill #';
      docNo = doc.billNo;
      dateLabel = 'Bill Date';
      isPurchase = true;
      break;
    default:
      docTitle = docType.toUpperCase().replace('_', ' ');
      docNo = doc.quotationNo || doc.orderNo || doc.poNo || doc.challanNo || doc._id;
  }

  // Party info
  const partyName = isPurchase
    ? (doc.supplierNameSnapshot || doc.supplierId?.name || 'Vendor')
    : (doc.customerNameSnapshot || doc.customerId?.name || 'Customer');

  const partyGSTIN = isPurchase
    ? (doc.supplierGSTINSnapshot || doc.supplierId?.gstin)
    : (doc.customerGSTINSnapshot || doc.customerId?.gstin);

  const partyAddress = isPurchase
    ? (doc.supplierAddressSnapshot || doc.supplierId?.address)
    : (doc.billingAddressSnapshot || doc.customerId?.billingAddress);

  const shippingAddress = doc.shippingAddressSnapshot || doc.deliveryAddressSnapshot || doc.customerId?.shippingAddress;

  const items = doc.items || [];
  const extraCharges = doc.extraCharges || [];

  const cgstVal = doc.cgstTotal !== undefined && doc.cgstTotal > 0
    ? doc.cgstTotal
    : (!doc.isInterState && doc.totalTax > 0 ? doc.totalTax / 2 : 0);
  const sgstVal = doc.sgstTotal !== undefined && doc.sgstTotal > 0
    ? doc.sgstTotal
    : (!doc.isInterState && doc.totalTax > 0 ? doc.totalTax / 2 : 0);
  const igstVal = doc.igstTotal !== undefined && doc.igstTotal > 0
    ? doc.igstTotal
    : (doc.isInterState && doc.totalTax > 0 ? doc.totalTax : 0);

  return (
    <div
      ref={ref}
      className="print-area"
      style={{
        width: '100%',
        maxWidth: '820px',
        margin: '0 auto',
        padding: '32px',
        background: '#ffffff',
        color: '#0f172a',
        borderRadius: isMinimal ? '0' : '12px',
        boxShadow: isMinimal ? 'none' : '0 4px 16px rgba(0,0,0,0.06)',
        border: isClassic ? '2px solid #334155' : isMinimal ? '1px solid #e2e8f0' : '1px solid #e2e8f0',
        fontFamily: isMinimal ? 'system-ui, sans-serif' : 'Plus Jakarta Sans, sans-serif'
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: isClassic ? '2px solid #334155' : '1px solid #e2e8f0',
          paddingBottom: '20px',
          marginBottom: '20px'
        }}
      >
        <div>
          {business.logoUrl ? (
            <img src={business.logoUrl} alt="Logo" style={{ maxHeight: '55px', marginBottom: '8px' }} />
          ) : (
            <h3 style={{ margin: 0, fontWeight: 800, color: isClassic ? '#0f172a' : '#4f46e5', letterSpacing: '-0.02em' }}>
              {business.name}
            </h3>
          )}
          <div style={{ fontSize: '0.85rem', color: '#475569', maxWidth: '340px', marginTop: '4px' }}>
            {business.address}, {business.city ? `${business.city}, ` : ''}{business.state} - {business.pincode}
          </div>
          {business.gstin && (
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
              GSTIN: {business.gstin} {business.pan ? `| PAN: ${business.pan}` : ''}
            </div>
          )}
          {business.phone && (
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Phone: {business.phone} {business.email ? `| Email: ${business.email}` : ''}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              display: 'inline-block',
              background: isClassic ? '#334155' : '#eef2ff',
              color: isClassic ? '#ffffff' : '#4338ca',
              padding: '6px 16px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '0.04em',
              marginBottom: '10px'
            }}
          >
            {docTitle}
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
            {docNoLabel} <span className="font-mono">{docNo}</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {dateLabel}: {formatDate(doc.date || doc.createdAt)}
          </div>
          {secondaryDateLabel && (
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {secondaryDateLabel}: {secondaryDate}
            </div>
          )}
          {doc.placeOfSupply && (
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
              Place of Supply: <strong>{doc.placeOfSupply}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Bill To & Ship To / Vendor Details */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '24px' }}>
        <div style={{ flex: 1, background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '6px' }}>
            {isPurchase ? 'Vendor / Supplier:' : 'Customer Details (Bill To):'}
          </div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{partyName}</div>
          {partyGSTIN && (
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
              GSTIN: {partyGSTIN}
            </div>
          )}
          {partyAddress && (
            <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px' }}>
              {partyAddress.street || partyAddress.addressLine1 || ''}
              {partyAddress.city ? `, ${partyAddress.city}` : ''}
              {partyAddress.state ? `, ${partyAddress.state}` : ''}
              {partyAddress.pincode ? ` - ${partyAddress.pincode}` : ''}
            </div>
          )}
        </div>

        {shippingAddress && (
          <div style={{ flex: 1, background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Shipping Address:
            </div>
            <div style={{ fontSize: '0.85rem', color: '#334155' }}>
              {shippingAddress.street || shippingAddress.addressLine1 || ''}
              {shippingAddress.city ? `, ${shippingAddress.city}` : ''}
              {shippingAddress.state ? `, ${shippingAddress.state}` : ''}
              {shippingAddress.pincode ? ` - ${shippingAddress.pincode}` : ''}
            </div>
          </div>
        )}
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ background: isClassic ? '#f1f5f9' : '#0f172a', color: isClassic ? '#0f172a' : '#ffffff', fontSize: '0.8rem', textTransform: 'uppercase' }}>
            <th style={{ padding: '10px 12px', textAlign: 'center', width: '40px' }}>#</th>
            <th style={{ padding: '10px 12px', textAlign: 'left' }}>Item Description</th>
            <th style={{ padding: '10px 12px', textAlign: 'center', width: '90px' }}>HSN/SAC</th>
            <th style={{ padding: '10px 12px', textAlign: 'center', width: '70px' }}>Qty</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', width: '90px' }}>Rate (₹)</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', width: '90px' }}>Taxable</th>
            <th style={{ padding: '10px 12px', textAlign: 'center', width: '70px' }}>GST%</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', width: '90px' }}>Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const qty = item.quantity || 1;
            const rate = item.rate || 0;
            const taxRate = item.taxRate || 0;
            const taxable = item.taxableAmount || (qty * rate * (1 - (item.discountPercent || 0) / 100));
            const total = item.total || (taxable + (taxable * taxRate) / 100);

            return (
              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                  {item.description && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.description}</div>}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'monospace', color: '#475569' }}>
                  {item.hsnSacCode || '-'}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>
                  {qty} {item.unit || ''}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                  {Number(rate).toFixed(2)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                  {Number(taxable).toFixed(2)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>
                  {taxRate}%
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                  {Number(total).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary / Calculation Breakdown */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '30px', marginBottom: '24px' }}>
        {/* Left Side: Notes & Terms */}
        <div style={{ flex: 1 }}>
          {doc.notes && (
            <div style={{ marginBottom: '14px', padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                Notes / Internal Remarks:
              </div>
              <div style={{ fontSize: '0.82rem', color: '#334155', whiteSpace: 'pre-line' }}>{doc.notes}</div>
            </div>
          )}

          {doc.terms && (
            <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                Terms & Conditions:
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                {doc.terms}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Totals */}
        <div style={{ width: '310px' }}>
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>Taxable Amount:</span>
              <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                {formatCurrency(doc.taxableAmount || doc.subtotal)}
              </span>
            </div>

            {cgstVal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>CGST:</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>+{formatCurrency(cgstVal)}</span>
              </div>
            )}

            {sgstVal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>SGST:</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>+{formatCurrency(sgstVal)}</span>
              </div>
            )}

            {igstVal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>IGST:</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>+{formatCurrency(igstVal)}</span>
              </div>
            )}

            {/* Extra Charges / Custom Fields */}
            {extraCharges.map((ch, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  color: ch.isDeduction ? '#dc2626' : '#16a34a'
                }}
              >
                <span>
                  {ch.name} {ch.type === 'percentage' ? `(${ch.rate}%)` : ''}:
                </span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                  {ch.isDeduction ? '-' : '+'}{formatCurrency(ch.amount)}
                </span>
              </div>
            ))}

            {doc.roundOff !== 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#64748b' }}>
                <span>Round Off:</span>
                <span style={{ fontFamily: 'monospace' }}>{formatCurrency(doc.roundOff)}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '2px solid #cbd5e1',
                paddingTop: '8px',
                marginTop: '8px',
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#0f172a'
              }}
            >
              <span>GRAND TOTAL:</span>
              <span style={{ color: '#4f46e5', fontFamily: 'monospace' }}>
                {formatCurrency(doc.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
          This is a computer-generated document and is valid without a physical seal.
        </div>
        <div style={{ textAlign: 'center', width: '220px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '45px' }}>
            For {business.name}
          </div>
          <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.78rem', color: '#475569' }}>
            Authorized Signatory
          </div>
        </div>
      </div>
    </div>
  );
});

export const DocumentModal = ({ isOpen, onClose, document: doc, business, docType = 'quotation' }) => {
  const [template, setTemplate] = useState('modern');
  const [downloading, setDownloading] = useState(false);
  const printComponentRef = useRef(null);

  if (!isOpen || !doc) return null;

  const docNo = doc.quotationNo || doc.orderNo || doc.poNo || doc.challanNo || doc.billNo || 'DOC';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printComponentRef.current) return;
    setDownloading(true);

    try {
      const element = printComponentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width mm
      const pageHeight = 297; // A4 height mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${docType.toUpperCase()}-${docNo}.pdf`);
    } catch (error) {
      console.error('[PDF Export Error]:', error);
      alert('Failed to generate PDF. Please use browser print option.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `${docType.replace('_', ' ').toUpperCase()} from ${business.name}\nNumber: ${docNo}\nTotal: ₹${Number(doc.grandTotal || 0).toLocaleString('en-IN')}\nThank you!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          {/* Modal Header */}
          <div className="modal-header no-print bg-light flex-column flex-md-row align-items-stretch align-items-md-center gap-3" style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
            <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
              <h5 className="modal-title mb-0 fw-bold d-flex align-items-center">
                <i className="bi bi-file-earmark-text text-primary me-2"></i> {docType.replace('_', ' ').toUpperCase()} #{docNo}
              </h5>
              <div className="d-flex align-items-center gap-1">
                <label className="small text-muted fw-bold mb-0 text-nowrap d-none d-sm-inline">Template:</label>
                <select
                  className="form-select form-select-sm"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  style={{ width: '135px', fontWeight: 600 }}
                >
                  <option value="modern">Modern (Color)</option>
                  <option value="classic">Classic GST</option>
                  <option value="minimal">Minimal</option>
                  <option value="professional">Corporate Pro</option>
                </select>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-end gap-1 flex-wrap">
              <button
                type="button"
                className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
                onClick={handleShareWhatsApp}
                title="Share on WhatsApp"
              >
                <i className="bi bi-whatsapp"></i> <span className="d-none d-sm-inline">WhatsApp</span>
              </button>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                onClick={handleDownloadPDF}
                disabled={downloading}
                title="Download PDF"
              >
                <i className="bi bi-file-earmark-pdf"></i> <span className="d-none d-sm-inline">{downloading ? 'PDF...' : 'PDF'}</span>
              </button>
              <button
                type="button"
                className="btn btn-primary-zenith btn-sm d-flex align-items-center gap-1"
                onClick={handlePrint}
                title="Print Document"
              >
                <i className="bi bi-printer"></i> <span>Print</span>
              </button>
              <button type="button" className="btn-close ms-2" onClick={onClose}></button>
            </div>
          </div>

          {/* Modal Body with Scrollable Canvas */}
          <div className="modal-body p-4" style={{ background: '#f8fafc', overflowY: 'auto' }}>
            <DocumentTemplate
              ref={printComponentRef}
              document={doc}
              business={business}
              docType={docType}
              template={template}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
