import React, { useRef, useState } from 'react';
import { InvoiceTemplate } from './InvoiceTemplate';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const InvoiceModal = ({ isOpen, onClose, invoice, business, upiQRCode }) => {
  const [template, setTemplate] = useState('modern');
  const [downloading, setDownloading] = useState(false);
  const printComponentRef = useRef(null);

  if (!isOpen || !invoice) return null;

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

      pdf.save(`Invoice-${invoice.invoiceNo}.pdf`);
    } catch (error) {
      console.error('[PDF Export Error]:', error);
      alert('Failed to generate PDF. Please use browser print option.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Invoice from ${business.name}\nInvoice No: ${invoice.invoiceNo}\nAmount Due: ₹${invoice.balanceAmount || invoice.grandTotal}\nThank you!`;
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
                <i className="bi bi-receipt text-primary me-2"></i> Invoice #{invoice.invoiceNo}
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
                  <option value="thermal">Thermal (80mm)</option>
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
                title="Print Invoice"
              >
                <i className="bi bi-printer"></i> <span>Print</span>
              </button>
              <button type="button" className="btn-close ms-2" onClick={onClose}></button>
            </div>
          </div>

          {/* Modal Body with Scrollable Invoice Canvas */}
          <div className="modal-body p-4" style={{ background: '#f8fafc', overflowY: 'auto' }}>
            <InvoiceTemplate
              ref={printComponentRef}
              invoice={invoice}
              business={business}
              template={template}
              upiQRCode={upiQRCode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
