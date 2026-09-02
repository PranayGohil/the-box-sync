import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const DebitNoteCreate = () => {
  const { activeBusiness } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [bills, setBills] = useState([]);
  const [selectedBillId, setSelectedBillId] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('purchase_return');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await api.get('/purchases/bills?status=finalized&limit=100');
      if (res.data.success) {
        setBills(res.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load purchase bills', 'error');
    }
  };

  const handleBillChange = (e) => {
    const billId = e.target.value;
    setSelectedBillId(billId);
    const found = bills.find((b) => b._id === billId);
    setSelectedBill(found || null);

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
    if (!selectedBillId) {
      addToast('Please select a purchase bill', 'warning');
      return;
    }

    if (activeItems.length === 0) {
      addToast('Please select at least one item to return with quantity > 0', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/purchases/returns', {
        purchaseBillId: selectedBillId,
        date: returnDate,
        items: activeItems,
        reason,
        warehouseId: selectedBill?.warehouseId,
        notes
      });

      if (res.data.success) {
        addToast('Purchase Return processed & Debit Note generated!', 'success');
        navigate('/purchases/returns');
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to process purchase return', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-zenith p-3 p-sm-4 mb-4">
      {/* 1. Page Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Record Purchase Return & Issue Debit Note
          </h4>
          <p className="text-muted small mb-0">
            Return goods to supplier, reverse Input Tax Credit (ITC), and issue formal Debit Note
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm align-self-stretch align-self-sm-auto text-nowrap"
          onClick={() => navigate('/purchases/returns')}
        >
          <i className="bi bi-arrow-left me-1"></i> Back to Debit Notes
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Bill & Return Reason Row */}
        <div className="row g-2 g-sm-3 mb-3">
          <div className="col-12 col-lg-5">
            <label className="form-label small fw-bold mb-1">Select Original Purchase Bill*</label>
            <select
              className="form-select fw-bold"
              value={selectedBillId}
              onChange={handleBillChange}
              required
            >
              <option value="">-- Choose Purchase Bill --</option>
              {bills.map((bill) => (
                <option key={bill._id} value={bill._id}>
                  #{bill.billNo} - {bill.supplierNameSnapshot} (₹{fmt(bill.grandTotal)})
                </option>
              ))}
            </select>
            {selectedBill && (
              <div className="small text-muted mt-1 text-truncate" style={{ fontSize: '0.75rem' }}>
                Supplier: <strong>{selectedBill.supplierNameSnapshot}</strong> | Bill Date: <strong>{new Date(selectedBill.billDate).toLocaleDateString('en-IN')}</strong>
              </div>
            )}
          </div>

          <div className="col-6 col-sm-4 col-lg-3">
            <label className="form-label small fw-bold mb-1">Return Date*</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              required
            />
          </div>

          <div className="col-6 col-sm-8 col-lg-4">
            <label className="form-label small fw-bold mb-1">Return Reason*</label>
            <select
              className="form-select form-select-sm fw-semibold"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="purchase_return">Supplier Return / Rejection</option>
              <option value="damaged_goods">Damaged / Defective Goods</option>
              <option value="wrong_item">Incorrect Material Received</option>
              <option value="price_dispute">Price Discrepancy / Overcharge</option>
            </select>
          </div>
        </div>

        {/* Select All / Deselect All Quick Bar */}
        {items.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mb-2 px-1">
            <div className="small text-muted font-mono" style={{ fontSize: '0.78rem' }}>
              <strong>{activeItems.length}</strong> of <strong>{items.length}</strong> items selected for return
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-link p-0 text-primary fw-bold"
                style={{ fontSize: '0.78rem', textDecoration: 'none' }}
                onClick={() => setItems(items.map((i) => ({ ...i, selected: true })))}
              >
                Select All
              </button>
              <span className="text-muted small">|</span>
              <button
                type="button"
                className="btn btn-sm btn-link p-0 text-muted"
                style={{ fontSize: '0.78rem', textDecoration: 'none' }}
                onClick={() => setItems(items.map((i) => ({ ...i, selected: false })))}
              >
                Deselect All
              </button>
            </div>
          </div>
        )}

        {/* 2. Line Items Desktop Table (>= 768px) */}
        <div className="table-responsive mb-3 border rounded d-none d-md-block">
          <table className="table table-bordered align-middle mb-0">
            <thead className="bg-light">
              <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ width: '5%' }} className="text-center">Return?</th>
                <th style={{ width: '40%' }}>Product / Purchased Item</th>
                <th style={{ width: '15%' }} className="text-center">Billed Qty</th>
                <th style={{ width: '15%' }} className="text-center">Return Qty</th>
                <th style={{ width: '12%' }} className="text-end">Cost Rate (₹)</th>
                <th style={{ width: '13%' }} className="text-end">Return Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    <i className="bi bi-receipt-cutoff fs-3 d-block mb-1 opacity-50"></i>
                    Please select a finalized purchase bill above to view returnable items.
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

        {/* 3. Mobile Line Items Card List (< 768px) */}
        <div className="d-md-none mb-3">
          {items.length === 0 ? (
            <div className="card-zenith p-4 text-center text-muted">
              <i className="bi bi-receipt-cutoff fs-3 d-block mb-1 opacity-50"></i>
              <div className="fw-bold">No Items Loaded</div>
              <div className="small">Please select a purchase bill to view items.</div>
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={idx}
                className={`card p-3 mb-2 border rounded ${item.selected ? 'bg-white border-danger-subtle shadow-sm' : 'bg-light opacity-60'}`}
                style={{ overflow: 'hidden' }}
              >
                {/* Header Row: Checkbox, Badge, Return Total */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="form-check d-flex align-items-center gap-2 mb-0">
                    <input
                      type="checkbox"
                      id={`mob-dn-item-${idx}`}
                      className="form-check-input"
                      checked={item.selected}
                      onChange={() => handleToggleItem(idx)}
                      style={{ cursor: 'pointer', width: '1.15rem', height: '1.15rem' }}
                    />
                    <label htmlFor={`mob-dn-item-${idx}`} className="form-check-label fw-bold small" style={{ cursor: 'pointer', fontSize: '0.78rem' }}>
                      {item.selected ? 'Returning' : 'Skip Item'}
                    </label>
                  </div>
                  <span className="fw-bold font-mono text-danger" style={{ fontSize: '0.95rem' }}>
                    ₹{fmt(item.selected ? item.total : 0)}
                  </span>
                </div>

                {/* Product Name & HSN */}
                <div className="mb-2">
                  <div className="fw-bold text-dark small">{item.name}</div>
                  {item.hsnSacCode && (
                    <span className="small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                      HSN: {item.hsnSacCode}
                    </span>
                  )}
                </div>

                {/* Billed Qty & Cost Rate Strip */}
                <div className="d-flex justify-content-between font-mono small text-muted py-1 px-2 mb-2 bg-light rounded border" style={{ fontSize: '0.75rem' }}>
                  <span>Billed: <strong className="text-dark">{item.maxQuantity} {item.unit}</strong></span>
                  <span>Rate: <strong className="text-dark">₹{fmt(item.rate)}</strong></span>
                </div>

                {/* Return Quantity Stepper */}
                {item.selected && (
                  <div className="d-flex align-items-center justify-content-between gap-2 pt-1">
                    <span className="small fw-semibold text-muted" style={{ fontSize: '0.78rem' }}>Return Qty:</span>
                    <div className="input-group input-group-sm" style={{ width: '140px' }}>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm px-2 fw-bold"
                        disabled={item.quantity <= 0}
                        onClick={() => handleItemQuantityChange(idx, Math.max(0, Number(item.quantity || 0) - 1))}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        className="form-control form-control-sm font-mono text-center fw-bold px-1"
                        value={item.quantity}
                        min="0"
                        max={item.maxQuantity}
                        onChange={(e) => handleItemQuantityChange(idx, e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm px-2 fw-bold"
                        disabled={item.quantity >= item.maxQuantity}
                        onClick={() => handleItemQuantityChange(idx, Math.min(item.maxQuantity, Number(item.quantity || 0) + 1))}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Bottom Section: Notes & Summary Calculation */}
        <div className="row g-3 g-md-4">
          <div className="col-12 col-md-6">
            <div className="mb-3">
              <label className="form-label small fw-bold mb-1">Return Remarks & Vendor Rejection Notes</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Reason for return, rejection slip number, debit note explanation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Right Calculation Totals Card */}
          <div className="col-12 col-md-6">
            <div className="card p-3 p-sm-4 bg-light border rounded shadow-sm" style={{ overflow: 'hidden' }}>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Return Taxable Subtotal:</span>
                <span className="fw-bold font-mono text-dark">₹{fmt(subtotal)}</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">ITC GST Reversal:</span>
                <span className="fw-bold font-mono text-danger">+₹{fmt(totalTax)}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-top border-bottom my-2">
                <span className="fw-extrabold fs-5">TOTAL DEBIT NOTE:</span>
                <span className="fw-extrabold fs-5 text-danger font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>

              <button
                type="submit"
                className="btn btn-danger py-2 mt-3 w-100 justify-content-center fw-bold fs-6 shadow-sm"
                disabled={loading || activeItems.length === 0}
              >
                {loading ? 'Processing Return...' : 'Confirm Return & Issue Debit Note'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
