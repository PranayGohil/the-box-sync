import React from 'react';

export const InvoiceTemplate = React.forwardRef(({ invoice, business, template = 'modern', upiQRCode = null }, ref) => {
  if (!invoice || !business) return null;

  const isThermal = template === 'thermal';
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

  // --- THERMAL RECEIPT (80mm) ---
  if (isThermal) {
    return (
      <div
        ref={ref}
        className="print-area font-mono"
        style={{
          width: '300px',
          margin: '0 auto',
          padding: '12px',
          background: '#ffffff',
          color: '#000000',
          fontSize: '12px',
          lineHeight: 1.4
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>{business.name}</h4>
          <div>{business.address}</div>
          <div>{business.city}, {business.state} - {business.pincode}</div>
          {business.phone && <div>Tel: {business.phone}</div>}
          {business.gstin && <div><strong>GSTIN: {business.gstin}</strong></div>}
        </div>

        <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', margin: '8px 0' }}>
          <div><strong>TAX INVOICE</strong></div>
          <div>Invoice No: <strong>{invoice.invoiceNo}</strong></div>
          <div>Date: {formatDate(invoice.invoiceDate)}</div>
          <div>Customer: {invoice.customerNameSnapshot}</div>
          {invoice.customerGSTINSnapshot && <div>GSTIN: {invoice.customerGSTINSnapshot}</div>}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <th style={{ textAlign: 'left' }}>Item</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Rate</th>
              <th style={{ textAlign: 'right' }}>Amt</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: '3px 0' }}>{item.name}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{item.rate}</td>
                <td style={{ textAlign: 'right' }}>{item.total?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: '1px dashed #000', paddingTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Taxable Amount:</span>
            <span>{formatCurrency(invoice.taxableAmount)}</span>
          </div>
          {invoice.cgstTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CGST:</span>
              <span>{formatCurrency(invoice.cgstTotal)}</span>
            </div>
          )}
          {invoice.sgstTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>SGST:</span>
              <span>{formatCurrency(invoice.sgstTotal)}</span>
            </div>
          )}
          {invoice.igstTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>IGST:</span>
              <span>{formatCurrency(invoice.igstTotal)}</span>
            </div>
          )}
          {invoice.roundOff !== 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Round Off:</span>
              <span>{formatCurrency(invoice.roundOff)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', borderTop: '1px solid #000', marginTop: '4px', paddingTop: '4px' }}>
            <span>GRAND TOTAL:</span>
            <span>{formatCurrency(invoice.grandTotal)}</span>
          </div>
        </div>

        {upiQRCode && (
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Scan to Pay via UPI</div>
            <img src={upiQRCode} alt="UPI QR" style={{ width: '110px', height: '110px' }} />
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '11px' }}>
          <div>*** THANK YOU FOR YOUR BUSINESS ***</div>
        </div>
      </div>
    );
  }

  // --- A4 STANDARD INVOICE (Modern, Classic, Minimal, Professional) ---
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
            {business.address}, {business.city}, {business.state} - {business.pincode}
          </div>
          {business.gstin && (
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
              GSTIN: {business.gstin} | PAN: {business.pan || ''}
            </div>
          )}
          {business.phone && (
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Phone: {business.phone} | Email: {business.email}
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
              fontSize: '1.1rem',
              letterSpacing: '0.04em',
              marginBottom: '10px'
            }}
          >
            TAX INVOICE
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Invoice #: <span className="font-mono">{invoice.invoiceNo}</span></div>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Date: {formatDate(invoice.invoiceDate)}</div>
          {invoice.dueDate && <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Due Date: {formatDate(invoice.dueDate)}</div>}
          <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
            Place of Supply: <strong>{invoice.placeOfSupply} ({invoice.placeOfSupplyStateCode})</strong>
          </div>
        </div>
      </div>

      {/* Bill To & Ship To Details */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '24px' }}>
        <div style={{ flex: 1, background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Billed To (Customer):
          </div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{invoice.customerNameSnapshot}</div>
          {invoice.customerGSTINSnapshot && (
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
              GSTIN: {invoice.customerGSTINSnapshot}
            </div>
          )}
          {invoice.billingAddressSnapshot && (
            <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px' }}>
              {invoice.billingAddressSnapshot.street}, {invoice.billingAddressSnapshot.city}, {invoice.billingAddressSnapshot.state} - {invoice.billingAddressSnapshot.pincode}
            </div>
          )}
        </div>

        {invoice.shippingAddressSnapshot && (
          <div style={{ flex: 1, background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Shipped To:
            </div>
            <div style={{ fontSize: '0.85rem', color: '#334155' }}>
              {invoice.shippingAddressSnapshot.street}, {invoice.shippingAddressSnapshot.city}, {invoice.shippingAddressSnapshot.state} - {invoice.shippingAddressSnapshot.pincode}
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
            <th style={{ padding: '10px 12px', textAlign: 'center', width: '70px' }}>GST</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', width: '110px' }}>Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
              <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
              <td style={{ padding: '10px 12px' }}>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                {item.description && <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.description}</div>}
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.82rem' }}>{item.hsnSacCode || '-'}</td>
              <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{item.quantity} {item.unit || 'PCS'}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right' }}>{Number(item.rate).toFixed(2)}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right' }}>{Number(item.taxableValue).toFixed(2)}</td>
              <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.82rem' }}>{item.taxRate}%</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>{Number(item.total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Section: Bank details, QR & Financial Totals */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '30px' }}>
        {/* Left: Bank Info & UPI QR */}
        <div style={{ flex: 1.2 }}>
          {business.bankDetails?.bankName && (
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px', color: '#1e293b' }}>
                <i className="bi bi-bank me-1"></i> Bank Account Details
              </div>
              <div style={{ fontSize: '0.82rem', lineHeight: 1.5, color: '#334155' }}>
                <div>Bank Name: <strong>{business.bankDetails.bankName}</strong></div>
                <div>Account No: <strong>{business.bankDetails.accountNo}</strong></div>
                <div>IFSC Code: <strong>{business.bankDetails.ifsc}</strong></div>
                <div>Branch: {business.bankDetails.branch}</div>
                {business.upiId && <div>UPI ID: <strong>{business.upiId}</strong></div>}
              </div>
            </div>
          )}

          {upiQRCode && invoice.balanceAmount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#ecfdf5', padding: '10px 14px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
              <img src={upiQRCode} alt="UPI QR" style={{ width: '80px', height: '80px', borderRadius: '4px' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#065f46' }}>Instant UPI Payment</div>
                <div style={{ fontSize: '0.78rem', color: '#047857' }}>Scan with GPay, PhonePe, Paytm, BHIM</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#065f46', marginTop: '2px' }}>Amount: {formatCurrency(invoice.balanceAmount)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Calculations Breakdown */}
        <div style={{ flex: 1 }}>
          <div style={{ width: '100%', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
              <span style={{ color: '#64748b' }}>Taxable Subtotal:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(invoice.taxableAmount)}</span>
            </div>

            {invoice.cgstTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>CGST:</span>
                <span>{formatCurrency(invoice.cgstTotal)}</span>
              </div>
            )}
            {invoice.sgstTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>SGST:</span>
                <span>{formatCurrency(invoice.sgstTotal)}</span>
              </div>
            )}
            {invoice.igstTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>IGST:</span>
                <span>{formatCurrency(invoice.igstTotal)}</span>
              </div>
            )}
            {invoice.roundOff !== 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>Round Off:</span>
                <span>{formatCurrency(invoice.roundOff)}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderTop: '2px solid #0f172a',
                borderBottom: '2px solid #0f172a',
                margin: '8px 0',
                fontWeight: 800,
                fontSize: '1.2rem',
                color: '#0f172a'
              }}
            >
              <span>Grand Total:</span>
              <span>{formatCurrency(invoice.grandTotal)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '0.85rem', color: '#16a34a' }}>
              <span>Paid Amount:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '0.88rem', fontWeight: 700, color: invoice.balanceAmount > 0 ? '#dc2626' : '#16a34a' }}>
              <span>Balance Due:</span>
              <span>{formatCurrency(invoice.balanceAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Terms and Signature */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '28px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ flex: 1.5, fontSize: '0.78rem', color: '#64748b' }}>
          <div style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Terms & Conditions:</div>
          <div style={{ whiteSpace: 'pre-line' }}>{invoice.terms || business.settings?.termsAndConditions}</div>
        </div>

        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '45px' }}>
            For {business.name}:
          </div>
          {business.signatureUrl && (
            <img src={business.signatureUrl} alt="Signature" style={{ maxHeight: '40px', marginBottom: '4px' }} />
          )}
          <div style={{ fontSize: '0.8rem', fontWeight: 700, borderTop: '1px dashed #cbd5e1', paddingTop: '4px', display: 'inline-block', minWidth: '150px' }}>
            Authorized Signatory
          </div>
        </div>
      </div>
    </div>
  );
});
