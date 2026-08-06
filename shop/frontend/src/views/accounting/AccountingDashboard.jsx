import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Modal, Form } from 'react-bootstrap';
import { NavLink, useHistory } from 'react-router-dom';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import {
  getInvoices,
  getQuotations,
  getSalesOrders,
  getPurchaseOrders,
  getNotes,
  getGSTReports,
  getNumberSeries,
  updateNumberSeries,
  deleteInvoice,
  receivePurchaseItems,
  updatePurchaseOrderStatus
} from '../../api/accounting';
import { getUserTaxInfo } from '../../api/orderService';

const styles = `
  .acc-stat-card {
    border-radius: 16px !important;
    border: 1px solid rgba(255,255,255,0.45) !important;
    overflow: hidden;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .acc-stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(0,0,0,0.13) !important; }

  .acc-tab-bar {
    display: flex;
    gap: 4px;
    padding-bottom: 4px;
    border-bottom: 2px solid #e5e7eb;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  .acc-tab-btn {
    white-space: nowrap;
    border: none;
    background: none;
    padding: 7px 13px;
    font-size: 0.8rem;
    font-weight: 700;
    color: #64748b;
    border-radius: 10px 10px 0 0;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.02em;
  }
  .acc-tab-btn.active {
    color: #23b3f4;
    border-bottom: 3px solid #23b3f4;
    background: rgba(35,179,244,0.06);
  }
  .acc-tab-btn:hover:not(.active) { background: #f1f5f9; color: #334155; }
  .acc-mobile-select {
    border-radius: 12px !important;
    border: 1.5px solid #e5e7eb !important;
    font-size: 0.85rem !important;
    font-weight: 700 !important;
    color: #334155 !important;
    padding: 10px 14px !important;
    background: #f8fafc !important;
    appearance: auto;
    margin-bottom: 16px;
    width: 100%;
  }

  /* Desktop table */
  .acc-table { width: 100%; border-collapse: collapse; }
  .acc-table thead tr {
    background: #f8fafc;
    border-bottom: 2px solid #e5e7eb;
  }
  .acc-table thead th {
    padding: 10px 14px;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #94a3b8;
    white-space: nowrap;
  }
  .acc-table tbody tr {
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.12s;
  }
  .acc-table tbody tr:hover { background: #f8fafc; }
  .acc-table tbody td {
    padding: 12px 14px;
    font-size: 0.85rem;
    color: #334155;
    vertical-align: middle;
  }

  /* Mobile card list */
  .acc-list-card {
    border-radius: 14px;
    border: 1px solid #e5e7eb;
    background: #fff;
    padding: 14px 16px;
    margin-bottom: 10px;
    transition: box-shadow 0.15s;
  }
  .acc-list-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
  .acc-list-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  }
  .acc-list-card-num { font-size: 0.85rem; font-weight: 800; color: #1e293b; }
  .acc-list-card-meta { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }
  .acc-list-card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .acc-list-card-amount { font-size: 1rem; font-weight: 800; color: #334155; }
  .acc-action-btns { display: flex; gap: 6px; flex-wrap: wrap; }

  .acc-action-btn {
    font-size: 0.72rem;
    font-weight: 700;
    padding: 5px 12px;
    border-radius: 8px;
    border: 1.5px solid;
    cursor: pointer;
    transition: all 0.15s;
    background: transparent;
    letter-spacing: 0.02em;
  }
  .acc-action-btn.primary { border-color: #23b3f4; color: #23b3f4; }
  .acc-action-btn.primary:hover { background: #23b3f4; color: #fff; }
  .acc-action-btn.danger { border-color: #ef4444; color: #ef4444; }
  .acc-action-btn.danger:hover { background: #ef4444; color: #fff; }
  .acc-action-btn.success { border-color: #22c55e; color: #22c55e; }
  .acc-action-btn.success:hover { background: #22c55e; color: #fff; }

  .acc-empty {
    text-align: center;
    padding: 48px 20px;
    color: #94a3b8;
    font-size: 0.9rem;
  }
  .acc-empty-icon { font-size: 2.5rem; margin-bottom: 12px; opacity: 0.4; }

  .acc-header-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-start;
  }
  @media (min-width: 768px) {
    .acc-header-actions { justify-content: flex-end; }
  }

  .acc-quick-btn {
    font-size: 0.8rem;
    font-weight: 700;
    padding: 7px 16px;
    border-radius: 50px;
    white-space: nowrap;
    transition: all 0.15s;
  }
`;

const statusColor = (status) => {
  const map = {
    Paid: 'success', Completed: 'success', Approved: 'primary', Applied: 'success',
    Confirmed: 'primary', Ordered: 'info', Cancelled: 'danger', Draft: 'secondary',
    CREDIT: 'info', DEBIT: 'warning',
  };
  return map[status] || 'warning';
};

const EmptyState = ({ label }) => (
  <div className="acc-empty">
    <div className="acc-empty-icon">📄</div>
    <div>{label}</div>
  </div>
);

const AccountingDashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [gstReportData, setGstReportData] = useState(null);
  const [numberConfigs, setNumberConfigs] = useState([]);
  const [activeTab, setActiveTab] = useState('invoices');
  const history = useHistory();

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPo, setSelectedPo] = useState(null);
  const [receiveQuantities, setReceiveQuantities] = useState({});
  const [showPrefixModal, setShowPrefixModal] = useState(false);
  const [selectedPrefixDoc, setSelectedPrefixDoc] = useState('Invoice');
  const [newPrefix, setNewPrefix] = useState('');

  const fetchData = async () => {
    try {
      const [invRes, soRes, quotRes, poRes, noteRes, gstRes, nsRes] = await Promise.all([
        getInvoices(), getSalesOrders(), getQuotations(),
        getPurchaseOrders(), getNotes(), getGSTReports(), getNumberSeries()
      ]);
      setInvoices(invRes.data.data || []);
      setSalesOrders(soRes.data.data || []);
      setQuotations(quotRes.data.data || []);
      setPurchaseOrders(poRes.data.data || []);
      setNotes(noteRes.data.data || []);
      setGstReportData(gstRes.data.data || null);
      setNumberConfigs(nsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching accounting data:', error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const printAccountingDoc = async (doc, docType) => {
    let userData = {};
    try {
      const res = await getUserTaxInfo(localStorage.getItem('token'));
      userData = res.data || {};
    } catch (e) {
      console.error('Error fetching user info for print:', e);
    }

    const shopName = userData.name || localStorage.getItem('shopName') || 'My Store';
    const uploadDir = process.env.REACT_APP_UPLOAD_DIR || 'http://localhost:5001/uploads';
    const logoPath = userData.logo || localStorage.getItem('userLogo') || localStorage.getItem('shopLogo') || '';
    const logoUrl = logoPath ? (logoPath.startsWith('http') ? logoPath : `${uploadDir}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`) : '';
    const printDate = doc.date ? new Date(doc.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
    
    let docTitle = docType.toUpperCase();
    if (doc.noteType) {
      docTitle = `${doc.noteType} NOTE`;
    }
    const invoiceNo = doc.invoiceNumber || doc.salesOrderNumber || doc.purchaseOrderNumber || doc.noteNumber || 'N/A';
    const party = doc.customerDetails || doc.vendorDetails || doc.partyDetails || {};
    const partyTitle = docType === 'Purchase Order' ? 'Vendor / Supplier' : 'Client';

    const items = doc.items || [];
    const itemsHtml = items.map((item, index) => {
      const qty = Number(item.quantity) || 1;
      const rate = Number(item.rate || item.unitPrice || 0);
      const total = Number(item.totalAmount != null ? item.totalAmount : item.finalAmount || (qty * rate));
      return `
        <tr>
          <td style="text-align: center; border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 6px;">${index + 1}</td>
          <td style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 6px;">
            ${item.name || ''}
            ${item.hsnCode ? `<br><small style="color: #555;">HSN: ${item.hsnCode}</small>` : ''}
            ${item.serialNumbers && item.serialNumbers.length ? `<br><small style="color: #555;">S/N: ${item.serialNumbers.join(', ')}</small>` : ''}
          </td>
          <td style="text-align: center; border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 6px;">${qty} ${item.unit || 'pcs'}</td>
          <td style="text-align: right; border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 6px;">${rate.toFixed(2)}</td>
          <td style="text-align: right; border-bottom: 1px solid #000; padding: 6px; font-weight: bold;">${total.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const subTotal = Number(doc.summary?.taxableValue || doc.summary?.subTotal || 0);
    const cgst = Number(doc.summary?.cgstTotal || doc.summary?.totalCGST || 0);
    const sgst = Number(doc.summary?.sgstTotal || doc.summary?.totalSGST || 0);
    const igst = Number(doc.summary?.igstTotal || doc.summary?.totalIGST || 0);
    const grandTotal = Number(doc.summary?.grandTotal || 0);
    const extraAmt = Number(doc.extraDetails?.amount || 0);
    const tdsAmt = Number(doc.tdsDetails?.amount || 0);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${docTitle} - ${invoiceNo}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; background: #fff; margin: 0; padding: 20px; }
          .a4-invoice-container { width: 100%; max-width: 800px; margin: 0 auto; }
          .a4-items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #000; }
          .a4-items-table th { background-color: #5bc0de; color: #fff; padding: 8px 6px; border: 1px solid #000; font-size: 13px; text-transform: uppercase; }
          .a4-items-table td { padding: 6px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="a4-invoice-container">
          <!-- Header -->
          <table style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td style="width: 50%; vertical-align: top;">
                ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-width: 180px; max-height: 80px; object-fit: contain; margin-bottom: 10px;" />` : `<h1 style="color: #23b3f4; margin: 0; font-size: 28px;">${shopName}</h1>`}
              </td>
              <td style="width: 50%; text-align: right; vertical-align: top; font-size: 11px; color: #555;">
                <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 14px;">${shopName}</p>
                ${userData.address ? `<p style="margin: 0 0 4px 0;">${userData.address}</p>` : ''}
                ${(userData.city || userData.state) ? `<p style="margin: 0 0 4px 0;">${userData.city || ''}, ${userData.state || ''} ${userData.pincode ? `- ${userData.pincode}` : ''}</p>` : ''}
                ${userData.mobile ? `<p style="margin: 0 0 4px 0;"><strong>Phone:</strong> ${userData.mobile}</p>` : ''}
                ${userData.email ? `<p style="margin: 0 0 4px 0;"><strong>Email:</strong> ${userData.email}</p>` : ''}
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
                    <td style="font-weight: bold; padding-right: 10px; padding-bottom: 4px; text-align: right;">${partyTitle} :</td>
                    <td style="padding-bottom: 4px;"><strong>${party.name || 'Walk-in Customer'}</strong></td>
                  </tr>
                  ${party.phone ? `<tr><td style="font-weight: bold; padding-right: 10px; padding-bottom: 4px; text-align: right;">Phone No :</td><td style="padding-bottom: 4px;">${party.phone}</td></tr>` : ''}
                  ${(party.billingAddress || party.address) ? `<tr><td style="font-weight: bold; padding-right: 10px; padding-bottom: 4px; text-align: right;">Address :</td><td style="padding-bottom: 4px;">${party.billingAddress || party.address} ${party.state ? `, ${party.state}` : ''}</td></tr>` : ''}
                  ${party.gstin ? `<tr><td style="font-weight: bold; padding-right: 10px; padding-bottom: 4px; text-align: right;">GST No :</td><td style="padding-bottom: 4px;">${party.gstin}</td></tr>` : ''}
                </table>
              </td>
              <td style="width: 50%; vertical-align: top; text-align: right;">
                 <table style="font-size: 12px; float: right;">
                  <tr>
                    <td style="font-weight: bold; padding-right: 10px; padding-bottom: 4px; text-align: right;">Date :</td>
                    <td style="padding-bottom: 4px;">${printDate}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; padding-right: 10px; padding-bottom: 4px; text-align: right;">${docTitle} No :</td>
                    <td style="padding-bottom: 4px;"><strong>${invoiceNo}</strong></td>
                  </tr>
                  ${doc.reason ? `<tr><td style="font-weight: bold; padding-right: 10px; padding-bottom: 4px; text-align: right;">Reason :</td><td style="padding-bottom: 4px;">${doc.reason}</td></tr>` : ''}
                 </table>
              </td>
            </tr>
          </table>

          <!-- Title -->
          <h2 style="text-align: center; margin: 10px 0 15px 0; font-size: 20px; font-weight: bold; text-transform: uppercase;">${docTitle}</h2>

          <!-- Items Table -->
          <table class="a4-items-table">
            <thead>
              <tr>
                <th style="width: 8%; text-align: center;">Sr no</th>
                <th style="width: 47%; text-align: left;">Description</th>
                <th style="width: 15%; text-align: center;">Qty</th>
                <th style="width: 15%; text-align: right;">Per</th>
                <th style="width: 15%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml || '<tr><td colspan="5" style="text-align:center; padding:12px;">No items</td></tr>'}
              <tr><td style="border-right: 1px solid #000;">&nbsp;</td><td style="border-right: 1px solid #000;"></td><td style="border-right: 1px solid #000;"></td><td style="border-right: 1px solid #000;"></td><td></td></tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" rowspan="6" style="border-right: 1px solid #000; vertical-align: top; padding: 0; border-top: 1px solid #000;">
                  <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
                    <tr><th colspan="2" style="background-color: #5bc0de; color: #fff; padding: 4px; text-align: center; border-bottom: 1px solid #000;">Account &amp; Terms Details</th></tr>
                    <tr><td style="padding: 4px; border-bottom: 1px solid #000;"><strong>Account Name:</strong></td><td style="padding: 4px; border-bottom: 1px solid #000; border-left: 1px solid #000;">${shopName}</td></tr>
                    ${doc.termsAndConditions ? `<tr><td style="padding: 4px; border-bottom: 1px solid #000;"><strong>Terms:</strong></td><td style="padding: 4px; border-bottom: 1px solid #000; border-left: 1px solid #000;">${doc.termsAndConditions}</td></tr>` : ''}
                    ${doc.notes ? `<tr><td style="padding: 4px;"><strong>Notes:</strong></td><td style="padding: 4px; border-left: 1px solid #000;">${doc.notes}</td></tr>` : ''}
                  </table>
                </td>
                <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; padding: 4px 6px;">Sub Total</td>
                <td style="text-align: right; border-top: 1px solid #000; border-left: 1px solid #000; padding: 4px 6px;">${subTotal.toFixed(2)}</td>
              </tr>
              ${cgst > 0 ? `
              <tr>
                <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; padding: 4px 6px;">CGST</td>
                <td style="text-align: right; border-top: 1px solid #000; border-left: 1px solid #000; padding: 4px 6px;">${cgst.toFixed(2)}</td>
              </tr>` : ''}
              ${sgst > 0 ? `
              <tr>
                <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; padding: 4px 6px;">SGST</td>
                <td style="text-align: right; border-top: 1px solid #000; border-left: 1px solid #000; padding: 4px 6px;">${sgst.toFixed(2)}</td>
              </tr>` : ''}
              ${igst > 0 ? `
              <tr>
                <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; padding: 4px 6px;">IGST</td>
                <td style="text-align: right; border-top: 1px solid #000; border-left: 1px solid #000; padding: 4px 6px;">${igst.toFixed(2)}</td>
              </tr>` : ''}
              ${extraAmt !== 0 ? `
              <tr>
                <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; padding: 4px 6px;">${doc.extraDetails?.name || 'Adjustment'}</td>
                <td style="text-align: right; border-top: 1px solid #000; border-left: 1px solid #000; padding: 4px 6px;">${extraAmt.toFixed(2)}</td>
              </tr>` : ''}
              ${tdsAmt > 0 ? `
              <tr>
                <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; color: #ef4444; padding: 4px 6px;">TDS Deduction</td>
                <td style="text-align: right; border-top: 1px solid #000; border-left: 1px solid #000; color: #ef4444; padding: 4px 6px;">-${tdsAmt.toFixed(2)}</td>
              </tr>` : ''}
              <tr>
                <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px;">Total</td>
                <td style="font-weight: bold; text-align: right; border-top: 1px solid #000; border-left: 1px solid #000; border-bottom: 1px solid #000; padding: 6px; color: #23b3f4;">${grandTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <!-- Signatures -->
          <table style="width: 100%; margin-top: 20px;">
            <tr>
              <td style="width: 50%; vertical-align: bottom;">
                <div style="width: 230px; border: 1px solid #000; height: 70px; padding: 5px; font-size: 11px; color: #555;">
                  Receiver's Signature
                </div>
              </td>
              <td style="width: 50%; text-align: right; vertical-align: bottom;">
                <p style="margin: 0 0 35px 0; font-size: 12px; font-weight: bold;">For, ${shopName}</p>
                <p style="margin: 0; font-size: 12px; font-weight: bold; border-top: 1px solid #000; display: inline-block; padding-top: 4px;">(AUTHORIZED SIGNATORY)</p>
              </td>
            </tr>
          </table>

          <div style="margin-top: 25px; border-top: 2px solid #5bc0de; background-color: #d9edf7; padding: 8px; text-align: center; font-size: 10px;">
            Thank you for your business! | ${shopName}
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=850,height=900');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
    } else {
      toast.error('Pop-up blocked! Please allow pop-ups to print.');
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await deleteInvoice(id);
      toast.success('Invoice soft-deleted successfully');
      fetchData();
    } catch { toast.error('Failed to delete invoice'); }
  };

  const handleCancelPO = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this purchase order?')) return;
    try {
      await updatePurchaseOrderStatus(id, 'Cancelled');
      toast.success('Purchase Order cancelled successfully');
      fetchData();
    } catch { toast.error('Failed to cancel purchase order'); }
  };

  const handleCreateInvoiceFromPO = (po) => {
    history.push('/accounting/create-invoice', { items: po.items, customer: po.vendorDetails, purchaseOrderId: po._id });
  };

  const openReceiveModal = (po) => {
    setSelectedPo(po);
    const initialQty = {};
    po.items.forEach(item => { initialQty[item.name] = item.quantity - (item.receivedQuantity || 0); });
    setReceiveQuantities(initialQty);
    setShowReceiveModal(true);
  };

  const handleReceiveSubmit = async () => {
    try {
      const itemsReceived = Object.keys(receiveQuantities)
        .map(name => ({ name, quantity: Number(receiveQuantities[name] || 0), price: selectedPo.items.find(i => i.name === name)?.unitPrice || 0 }))
        .filter(i => i.quantity > 0);
      if (itemsReceived.length === 0) { toast.warn('Please specify received quantities'); return; }
      await receivePurchaseItems(selectedPo._id, itemsReceived);
      toast.success('Goods received successfully');
      setShowReceiveModal(false);
      fetchData();
    } catch { toast.error('Failed to record received items'); }
  };

  const handleSavePrefix = async () => {
    try {
      await updateNumberSeries({ docType: selectedPrefixDoc, prefix: newPrefix });
      toast.success('Number sequence configuration saved!');
      setShowPrefixModal(false);
      fetchData();
    } catch { toast.error('Failed to configure prefix series'); }
  };

  const totalSalesVal = invoices.reduce((sum, i) => sum + (i.summary?.grandTotal || 0), 0);
  const totalPurchasesVal = purchaseOrders.reduce((sum, p) => sum + (p.summary?.grandTotal || 0), 0);
  const collectedCGST = gstReportData?.gstSummary?.collected?.cgst || 0;
  const collectedSGST = gstReportData?.gstSummary?.collected?.sgst || 0;
  const collectedIGST = gstReportData?.gstSummary?.collected?.igst || 0;
  const collectedGSTTotal = collectedCGST + collectedSGST + collectedIGST;
  const paidCGST = gstReportData?.gstSummary?.paid?.cgst || 0;
  const paidSGST = gstReportData?.gstSummary?.paid?.sgst || 0;
  const paidIGST = gstReportData?.gstSummary?.paid?.igst || 0;
  const paidGSTTotal = paidCGST + paidSGST + paidIGST;

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'accounting', text: 'Accounting & Billing' },
  ];

  const tabs = [
    { key: 'invoices', label: 'Sales Invoices' },
    { key: 'salesOrders', label: 'Sales Orders' },
    { key: 'purchaseOrders', label: 'Purchase Orders' },
    { key: 'notes', label: 'Credit / Debit Notes' },
    { key: 'gstReports', label: 'GST Reports' },
  ];

  const statCards = [
    { label: 'Total Sales',    value: `₹${totalSalesVal.toFixed(2)}`,       icon: 'trend-up',   glass: 'rgba(35,179,244,0.12)',  iconColor: '#23b3f4', iconRing: 'rgba(35,179,244,0.18)',   valueTint: '#1565c0' },
    { label: 'Total Purchase', value: `₹${totalPurchasesVal.toFixed(2)}`,   icon: 'trend-down', glass: 'rgba(249,115,22,0.11)',  iconColor: '#f97316', iconRing: 'rgba(249,115,22,0.18)',   valueTint: '#c2410c' },
    { label: 'GST Collected',  value: `₹${collectedGSTTotal.toFixed(2)}`,   icon: 'coin',       glass: 'rgba(34,197,94,0.11)',  iconColor: '#16a34a', iconRing: 'rgba(34,197,94,0.18)',    valueTint: '#15803d' },
    { label: 'GST Paid',       value: `₹${paidGSTTotal.toFixed(2)}`,        icon: 'dollar',     glass: 'rgba(168,85,247,0.11)', iconColor: '#7c3aed', iconRing: 'rgba(168,85,247,0.18)',   valueTint: '#6d28d9' },
  ];

  return (
    <>
      <style>{styles}</style>

      {/* Page Header */}
      <div className="mb-4 mt-5 mt-lg-0">
        <Row className="align-items-start g-3">
          <Col xs={12} md="auto" className="me-auto">
            <h1 className="qsr-page-title">
              Accounting &amp; Billing
            </h1>
            <BreadcrumbList items={breadcrumbs} />
          </Col>
          <Col xs={12} md="auto">
            <div className="acc-header-actions">
              <Button variant="outline-secondary" className="acc-quick-btn" onClick={() => setShowPrefixModal(true)}>
                <CsLineIcons icon="settings" size="13" className="me-1" /> Prefixes
              </Button>
              <Button variant="primary" className="acc-quick-btn" as={NavLink} to="/accounting/create-invoice">
                + GST Invoice
              </Button>
              <Button variant="outline-primary" className="acc-quick-btn" as={NavLink} to="/accounting/create-sales-order">
                + Sales Order
              </Button>
              <Button variant="outline-info" className="acc-quick-btn" as={NavLink} to="/accounting/create-purchase-order">
                + Purchase Order
              </Button>
              <Button variant="outline-secondary" className="acc-quick-btn" as={NavLink} to="/accounting/create-note">
                + Credit/Debit Note
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      {/* Stat Cards */}
      <Row className="g-3 mb-4">
        {statCards.map((s, i) => (
          <Col xs={6} lg={3} key={i}>
            <div
              className="acc-stat-card"
              style={{
                background: s.glass,
                boxShadow: `0 4px 24px ${s.iconRing}`,
                borderRadius: 16,
              }}
            >
              <div className="p-2 p-sm-3 d-flex align-items-center gap-2">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                  style={{ width: 40, height: 40, minWidth: 40, background: s.iconRing, border: `1.5px solid ${s.iconColor}55` }}
                >
                  <CsLineIcons icon={s.icon} size="18" style={{ color: s.iconColor }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 'clamp(0.6rem, 2vw, 0.7rem)', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.2 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 'clamp(0.8rem, 3vw, 1.1rem)', fontWeight: 800, color: s.valueTint, marginTop: 2, wordBreak: 'break-all', lineHeight: 1.2 }}>
                    {s.value}
                  </div>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Main Card with Tabs */}
      <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
        <Card.Body className="p-3 p-md-4">

          {/* Mobile Tab Dropdown */}
          <div className="d-md-none">
            <select
              className="acc-mobile-select"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
            >
              {tabs.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>

          {/* Desktop Tab Bar */}
          <div className="acc-tab-bar d-none d-md-flex">
            {tabs.map(t => (
              <button type="button" key={t.key} className={`acc-tab-btn ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Sales Invoices */}
          {activeTab === 'invoices' && (
            <>
              {invoices.length === 0 ? <EmptyState label="No invoices found" /> : (
                <>
                  {/* Desktop Table */}
                  <div className="d-none d-md-block">
                    <table className="acc-table">
                      <thead>
                        <tr>
                          <th>Invoice No.</th>
                          <th>Customer</th>
                          <th>Date</th>
                          <th>Grand Total</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map(inv => (
                          <tr key={inv._id}>
                            <td><strong>{inv.invoiceNumber}</strong></td>
                            <td>{inv.customerDetails?.name}</td>
                            <td>{new Date(inv.date).toLocaleDateString('en-GB')}</td>
                            <td><strong>₹{inv.summary?.grandTotal?.toFixed(2)}</strong></td>
                            <td><Badge bg={statusColor(inv.status)} className="px-2 py-1 rounded-pill" style={{ fontSize: '0.7rem' }}>{inv.status}</Badge></td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="acc-action-btns justify-content-end">
                                <button type="button" className="acc-action-btn primary" onClick={() => printAccountingDoc(inv, 'Invoice')}>Print</button>
                                <button type="button" className="acc-action-btn danger" onClick={() => handleDeleteInvoice(inv._id)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile Cards */}
                  <div className="d-md-none">
                    {invoices.map(inv => (
                      <div className="acc-list-card" key={inv._id}>
                        <div className="acc-list-card-header">
                          <div>
                            <div className="acc-list-card-num">{inv.invoiceNumber}</div>
                            <div className="acc-list-card-meta">{inv.customerDetails?.name} · {new Date(inv.date).toLocaleDateString('en-GB')}</div>
                          </div>
                          <Badge bg={statusColor(inv.status)} className="px-2 py-1 rounded-pill" style={{ fontSize: '0.68rem' }}>{inv.status}</Badge>
                        </div>
                        <div className="acc-list-card-row">
                          <div className="acc-list-card-amount">₹{inv.summary?.grandTotal?.toFixed(2)}</div>
                          <div className="acc-action-btns">
                            <button type="button" className="acc-action-btn primary" onClick={() => printAccountingDoc(inv, 'Invoice')}>Print</button>
                            <button type="button" className="acc-action-btn danger" onClick={() => handleDeleteInvoice(inv._id)}>Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Sales Orders */}
          {activeTab === 'salesOrders' && (
            <>
              {salesOrders.length === 0 ? <EmptyState label="No sales orders found" /> : (
                <>
                  <div className="d-none d-md-block">
                    <table className="acc-table">
                      <thead>
                        <tr>
                          <th>Order No.</th>
                          <th>Customer</th>
                          <th>Date</th>
                          <th>Expected Delivery</th>
                          <th>Grand Total</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesOrders.map(so => (
                          <tr key={so._id}>
                            <td><strong>{so.salesOrderNumber}</strong></td>
                            <td>{so.customerDetails?.name}</td>
                            <td>{new Date(so.date).toLocaleDateString('en-GB')}</td>
                            <td>{so.expectedDelivery ? new Date(so.expectedDelivery).toLocaleDateString() : 'N/A'}</td>
                            <td><strong>₹{so.summary?.grandTotal?.toFixed(2)}</strong></td>
                            <td><Badge bg={statusColor(so.status)} className="px-2 py-1 rounded-pill" style={{ fontSize: '0.7rem' }}>{so.status}</Badge></td>
                            <td style={{ textAlign: 'right' }}>
                              <button type="button" className="acc-action-btn primary" onClick={() => printAccountingDoc(so, 'Sales Order')}>Print</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="d-md-none">
                    {salesOrders.map(so => (
                      <div className="acc-list-card" key={so._id}>
                        <div className="acc-list-card-header">
                          <div>
                            <div className="acc-list-card-num">{so.salesOrderNumber}</div>
                            <div className="acc-list-card-meta">{so.customerDetails?.name} · {new Date(so.date).toLocaleDateString('en-GB')}</div>
                          </div>
                          <Badge bg={statusColor(so.status)} className="px-2 py-1 rounded-pill" style={{ fontSize: '0.68rem' }}>{so.status}</Badge>
                        </div>
                        <div className="acc-list-card-row">
                          <div className="acc-list-card-amount">₹{so.summary?.grandTotal?.toFixed(2)}</div>
                          <button type="button" className="acc-action-btn primary" onClick={() => printAccountingDoc(so, 'Sales Order')}>Print</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Purchase Orders */}
          {activeTab === 'purchaseOrders' && (
            <>
              {purchaseOrders.length === 0 ? <EmptyState label="No purchase orders found" /> : (
                <>
                  <div className="d-none d-md-block">
                    <table className="acc-table">
                      <thead>
                        <tr>
                          <th>PO Number</th>
                          <th>Vendor</th>
                          <th>Date</th>
                          <th>Warehouse</th>
                          <th>Grand Total</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseOrders.map(po => (
                          <tr key={po._id}>
                            <td><strong>{po.purchaseOrderNumber}</strong></td>
                            <td>{po.vendorDetails?.name}</td>
                            <td>{new Date(po.date).toLocaleDateString('en-GB')}</td>
                            <td>{po.warehouse || 'General'}</td>
                            <td><strong>₹{po.summary?.grandTotal?.toFixed(2)}</strong></td>
                            <td><Badge bg={statusColor(po.status)} className="px-2 py-1 rounded-pill" style={{ fontSize: '0.7rem' }}>{po.status}</Badge></td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="acc-action-btns justify-content-end">
                                {['Draft', 'Approved', 'Ordered', 'Received'].includes(po.status) && (
                                  <>
                                    <button type="button" className="acc-action-btn success" onClick={() => handleCreateInvoiceFromPO(po)}>Invoice</button>
                                    <button type="button" className="acc-action-btn danger" onClick={() => handleCancelPO(po._id)}>Cancel</button>
                                  </>
                                )}
                                <button type="button" className="acc-action-btn primary" onClick={() => printAccountingDoc(po, 'Purchase Order')}>Print</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="d-md-none">
                    {purchaseOrders.map(po => (
                      <div className="acc-list-card" key={po._id}>
                        <div className="acc-list-card-header">
                          <div>
                            <div className="acc-list-card-num">{po.purchaseOrderNumber}</div>
                            <div className="acc-list-card-meta">{po.vendorDetails?.name} · {new Date(po.date).toLocaleDateString('en-GB')}</div>
                          </div>
                          <Badge bg={statusColor(po.status)} className="px-2 py-1 rounded-pill" style={{ fontSize: '0.68rem' }}>{po.status}</Badge>
                        </div>
                        <div className="acc-list-card-row">
                          <div className="acc-list-card-amount">₹{po.summary?.grandTotal?.toFixed(2)}</div>
                          <div className="acc-action-btns">
                            {['Draft', 'Approved', 'Ordered', 'Received'].includes(po.status) && (
                              <>
                                <button type="button" className="acc-action-btn success" onClick={() => handleCreateInvoiceFromPO(po)}>Invoice</button>
                                <button type="button" className="acc-action-btn danger" onClick={() => handleCancelPO(po._id)}>Cancel</button>
                              </>
                            )}
                            <button type="button" className="acc-action-btn primary" onClick={() => printAccountingDoc(po, 'Purchase Order')}>Print</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Credit / Debit Notes */}
          {activeTab === 'notes' && (
            <>
              {notes.length === 0 ? <EmptyState label="No credit/debit notes found" /> : (
                <>
                  <div className="d-none d-md-block">
                    <table className="acc-table">
                      <thead>
                        <tr>
                          <th>Note No.</th>
                          <th>Type</th>
                          <th>Party</th>
                          <th>Date</th>
                          <th>Reason</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notes.map(n => (
                          <tr key={n._id}>
                            <td><strong>{n.noteNumber}</strong></td>
                            <td><Badge bg={statusColor(n.noteType)} className="px-2 py-1 rounded-pill" style={{ fontSize: '0.7rem' }}>{n.noteType}</Badge></td>
                            <td>{n.partyDetails?.name}</td>
                            <td>{new Date(n.date).toLocaleDateString('en-GB')}</td>
                            <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.reason}</td>
                            <td><strong>₹{n.summary?.grandTotal?.toFixed(2)}</strong></td>
                            <td><Badge bg={statusColor(n.status)} className="px-2 py-1 rounded-pill" style={{ fontSize: '0.7rem' }}>{n.status}</Badge></td>
                            <td style={{ textAlign: 'right' }}>
                              <button type="button" className="acc-action-btn primary" onClick={() => printAccountingDoc(n, 'Credit/Debit Note')}>Print</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="d-md-none">
                    {notes.map(n => (
                      <div className="acc-list-card" key={n._id}>
                        <div className="acc-list-card-header">
                          <div>
                            <div className="acc-list-card-num">{n.noteNumber}</div>
                            <div className="acc-list-card-meta">{n.partyDetails?.name} · {new Date(n.date).toLocaleDateString('en-GB')}</div>
                          </div>
                          <Badge bg={statusColor(n.noteType)} className="px-2 py-1 rounded-pill" style={{ fontSize: '0.68rem' }}>{n.noteType}</Badge>
                        </div>
                        {n.reason && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>{n.reason}</div>}
                        <div className="acc-list-card-row">
                          <div>
                            <div className="acc-list-card-amount">₹{n.summary?.grandTotal?.toFixed(2)}</div>
                            <Badge bg={statusColor(n.status)} className="px-2 py-1 rounded-pill mt-1" style={{ fontSize: '0.65rem' }}>{n.status}</Badge>
                          </div>
                          <button type="button" className="acc-action-btn primary" onClick={() => printAccountingDoc(n, 'Credit/Debit Note')}>Print</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* GST Reports */}
          {activeTab === 'gstReports' && (
            gstReportData ? (
              <div>
                <h6 className="fw-bold text-primary mb-3">HSN Code Summary</h6>
                <div>
                  <table className="acc-table" style={{ border: '1px solid #e5e7eb' }}>
                    <thead>
                      <tr>
                        <th>HSN Code</th>
                        <th>Qty Sold</th>
                        <th>Taxable Value</th>
                        <th>GST Rate</th>
                        <th>CGST</th>
                        <th>SGST</th>
                        <th>IGST</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstReportData.hsnSummary?.length === 0 ? (
                        <tr><td colSpan="8" className="text-center py-4 text-muted">No HSN Transactions Found</td></tr>
                      ) : (
                        gstReportData.hsnSummary?.map(row => (
                          <tr key={row.hsn}>
                            <td><strong>{row.hsn}</strong></td>
                            <td>{row.quantity}</td>
                            <td>₹{row.taxableValue.toFixed(2)}</td>
                            <td>{row.taxRate}%</td>
                            <td>₹{row.cgst.toFixed(2)}</td>
                            <td>₹{row.sgst.toFixed(2)}</td>
                            <td>₹{row.igst.toFixed(2)}</td>
                            <td><strong>₹{row.total.toFixed(2)}</strong></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <Row className="g-3 mt-3">
                  <Col xs={12} md={6}>
                    <Card className="border shadow-none" style={{ borderRadius: 12 }}>
                      <Card.Body className="p-3">
                        <h6 className="fw-bold text-success mb-3" style={{ fontSize: '0.85rem' }}>GSTR-1 Sales Report</h6>
                        <div style={{ overflowX: 'auto', maxHeight: 220 }}>
                          <table className="acc-table">
                            <thead><tr><th>Invoice</th><th>Customer</th><th>Total</th></tr></thead>
                            <tbody>
                              {gstReportData.gstr1?.map(s => (
                                <tr key={s.invoiceNumber}>
                                  <td>{s.invoiceNumber}</td>
                                  <td>{s.customerName}</td>
                                  <td>₹{s.grandTotal}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={12} md={6}>
                    <Card className="border shadow-none" style={{ borderRadius: 12 }}>
                      <Card.Body className="p-3">
                        <h6 className="fw-bold text-danger mb-3" style={{ fontSize: '0.85rem' }}>GSTR-2 Purchase Report</h6>
                        <div style={{ overflowX: 'auto', maxHeight: 220 }}>
                          <table className="acc-table">
                            <thead><tr><th>PO No</th><th>Supplier</th><th>Total</th></tr></thead>
                            <tbody>
                              {gstReportData.gstr2?.map(p => (
                                <tr key={p.purchaseOrderNumber}>
                                  <td>{p.purchaseOrderNumber}</td>
                                  <td>{p.supplierName}</td>
                                  <td>₹{p.grandTotal}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            ) : (
              <EmptyState label="No GST logs recorded yet" />
            )
          )}

        </Card.Body>
      </Card>

      {/* Prefix Series Config Modal */}
      <Modal show={showPrefixModal} onHide={() => setShowPrefixModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1rem', fontWeight: 800 }}>Configure Numbering Series</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase">Document Type</Form.Label>
            <Form.Select value={selectedPrefixDoc} onChange={(e) => setSelectedPrefixDoc(e.target.value)}>
              <option value="Invoice">GST Tax Invoice</option>
              <option value="SalesOrder">Sales Order</option>
              <option value="PurchaseOrder">Purchase Order</option>
              <option value="CreditNote">Credit Note</option>
              <option value="DebitNote">Debit Note</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase">Number Series Prefix</Form.Label>
            <Form.Control type="text" placeholder="e.g. INV-2026-" value={newPrefix} onChange={(e) => setNewPrefix(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowPrefixModal(false)}>Close</Button>
          <Button variant="primary" onClick={handleSavePrefix}>Save Configuration</Button>
        </Modal.Footer>
      </Modal>

      {/* Receive PO Items Modal */}
      {selectedPo && (
        <Modal show={showReceiveModal} onHide={() => setShowReceiveModal(false)} centered size="md">
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: '0.95rem', fontWeight: 800 }}>Goods Receipt — {selectedPo.purchaseOrderNumber}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedPo.items.map(item => (
              <Row className="mb-3 align-items-center" key={item.name}>
                <Col xs={7}>
                  <strong style={{ fontSize: '0.85rem' }}>{item.name}</strong>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Ordered: {item.quantity} · Received: {item.receivedQuantity || 0}</div>
                </Col>
                <Col xs={5}>
                  <Form.Control
                    type="number" min="0"
                    max={item.quantity - (item.receivedQuantity || 0)}
                    value={receiveQuantities[item.name] || 0}
                    onChange={(e) => setReceiveQuantities({ ...receiveQuantities, [item.name]: Number(e.target.value) })}
                    style={{ borderRadius: 10 }}
                  />
                </Col>
              </Row>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowReceiveModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleReceiveSubmit}>Submit Receipt</Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
};

export default AccountingDashboard;
