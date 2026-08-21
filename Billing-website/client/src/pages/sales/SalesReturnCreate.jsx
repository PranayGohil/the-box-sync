import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const SalesReturnCreate = () => {
  const { activeBusiness } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('sales_return');
  const [restockStock, setRestockStock] = useState(true);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/sales/invoices?status=finalized&limit=100');
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load finalized invoices', 'error');
    }
  };

  const handleInvoiceChange = (e) => {
    const invId = e.target.value;
    setSelectedInvoiceId(invId);
    const found = invoices.find((i) => i._id === invId);
    setSelectedInvoice(found || null);

    if (found && found.items) {
      setItems(
        found.items.map((it) => ({
          productId: it.productId,
          name: it.name,
          hsnSacCode: it.hsnSacCode || '',
          maxQuantity: it.quantity,
          quantity: it.quantity,
          rate: it.rate,
          taxRate: it.taxRate || 18,
          unit: it.unit || 'PCS',
          total: (Number(it.quantity) || 0) * (Number(it.rate) || 0),
          selected: true
        }))
      );
    } else {
      setItems([]);
    }
  };

  const handleItemQuantityChange = (index, qty) => {
    const updated = [...items];
    const max = updated[index].maxQuantity || 9999;
    const clampedQty = Math.max(0, Math.min(Number(qty) || 0, max));
    updated[index].quantity = clampedQty;
    updated[index].total = clampedQty * (Number(updated[index].rate) || 0);
    setItems(updated);
  };

  const handleToggleItem = (index) => {
    const updated = [...items];
    updated[index].selected = !updated[index].selected;
    setItems(updated);
  };

  // Calculations
  const activeItems = items.filter((i) => i.selected && i.quantity > 0);
  const subtotal = activeItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const totalTax = activeItems.reduce((sum, item) => {
    const amt = Number(item.total) || 0;
    const rate = Number(item.taxRate) || 0;
    return sum + (amt * rate) / 100;
  }, 0);

  const grandTotal = Math.round(subtotal + totalTax);

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      addToast('Please select an invoice', 'warning');
      return;
    }

    if (activeItems.length === 0) {
      addToast('Please select at least one item to return with quantity > 0', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/sales/returns', {
        invoiceId: selectedInvoiceId,
        date: returnDate,
        items: activeItems,
        reason,
        stockRestocked: restockStock,
        notes
      });

      if (res.data.success) {
        addToast('Sales Return processed & Credit Note generated!', 'success');
        navigate('/sales/returns');
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to process return', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-zenith p-3 p-sm-4 mb-5">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Process Sales Return & Issue Credit Note
          </h4>
          <p className="text-muted small mb-0">
            Accept returned goods, automatically replenish warehouse inventory, and issue GST Credit Note
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm text-nowrap"
          onClick={() => navigate('/sales/returns')}
        >
          <i className="bi bi-arrow-left me-1"></i> Back to Sales Returns
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Invoice & Return Reason Row */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-5">
            <label className="form-label">Select Original Finalized Invoice*</label>
            <select
              className="form-select fw-bold"
              value={selectedInvoiceId}
              onChange={handleInvoiceChange}
              required
            >
              <option value="">-- Choose Invoice --</option>
              {invoices.map((inv) => (
                <option key={inv._id} value={inv._id}>
                  #{inv.invoiceNo} - {inv.customerNameSnapshot} (₹{fmt(inv.grandTotal)})
                </option>
              ))}
            </select>
            {selectedInvoice && (
              <div className="small text-muted mt-1">
                Customer: <strong>{selectedInvoice.customerNameSnapshot}</strong> | Invoice Date: <strong>{new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-IN')}</strong>
              </div>
            )}
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label">Return Date*</label>
            <input
              type="date"
              className="form-control"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              required
            />
          </div>

          <div className="col-6 col-md-4">
            <label className="form-label">Return Reason*</label>
            <select
              className="form-select fw-semibold"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="sales_return">Customer Return / Exchange</option>
              <option value="damaged_goods">Damaged / Defective Goods</option>
              <option value="wrong_item">Wrong Item Delivered</option>
              <option value="price_dispute">Price Adjustment / Discount Dispute</option>
            </select>
          </div>
        </div>

        {/* Restock Inventory Banner */}
        <div className="p-2 mb-3 bg-light border rounded d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-box-arrow-in-down text-success fs-5"></i>
            <div>
              <span className="fw-bold small text-dark">Automatically Restock Warehouse Inventory</span>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                Adds returned quantities back to inventory stock ledger with an inward return voucher.
              </div>
            </div>
          </div>
          <div className="form-check form-switch mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              checked={restockStock}
              onChange={(e) => setRestockStock(e.target.checked)}
              style={{ width: '40px', height: '20px', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Line Items Table from Selected Invoice */}
        <div className="table-responsive mb-3 border rounded">
          <table className="table table-bordered align-middle mb-0">
            <thead className="bg-light">
              <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ width: '5%' }} className="text-center">Return?</th>
                <th style={{ width: '40%' }}>Product / Description</th>
                <th style={{ width: '15%' }} className="text-center">Invoiced Qty</th>
                <th style={{ width: '15%' }} className="text-center">Return Qty</th>
                <th style={{ width: '12%' }} className="text-end">Rate (₹)</th>
                <th style={{ width: '13%' }} className="text-end">Return Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    <i className="bi bi-receipt fs-3 d-block mb-1 opacity-50"></i>
                    Please select a finalized invoice above to view returnable line items.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx} className={item.selected ? 'bg-white' : 'table-light opacity-50'}>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={item.selected}
                        onChange={() => handleToggleItem(idx)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{item.name}</div>
                      {item.hsnSacCode && <span className="small text-muted font-mono">HSN: {item.hsnSacCode}</span>}
                    </td>
                    <td className="text-center font-mono fw-semibold text-muted">
                      {item.maxQuantity} {item.unit}
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm font-mono text-center fw-bold"
                        value={item.quantity}
                        min="0"
                        max={item.maxQuantity}
                        disabled={!item.selected}
                        onChange={(e) => handleItemQuantityChange(idx, e.target.value)}
                      />
                    </td>
                    <td className="text-end font-mono">
                      ₹{fmt(item.rate)}
                    </td>
                    <td className="text-end fw-bold font-mono text-danger">
                      ₹{fmt(item.selected ? item.total : 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Section: Remarks & Summary Calculation */}
        <div className="row g-4">
          <div className="col-12 col-md-6">
            <div className="mb-3">
              <label className="form-label">Return Notes & Inspection Remarks</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Product condition, customer comments, batch number notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Right Calculation Totals Card */}
          <div className="col-12 col-md-6">
            <div className="card p-3 bg-light border">
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Return Taxable Subtotal:</span>
                <span className="fw-bold font-mono text-dark">₹{fmt(subtotal)}</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">GST Tax Reversal:</span>
                <span className="fw-bold font-mono text-danger">+₹{fmt(totalTax)}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-top border-bottom my-2">
                <span className="fw-extrabold fs-5">TOTAL CREDIT NOTE:</span>
                <span className="fw-extrabold fs-5 text-danger font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>

              <button
                type="submit"
                className="btn btn-danger py-2 mt-3 w-100 justify-content-center fw-bold fs-6 shadow-sm"
                disabled={loading || activeItems.length === 0}
              >
                {loading ? 'Processing Return...' : 'Confirm Return & Issue Credit Note'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
