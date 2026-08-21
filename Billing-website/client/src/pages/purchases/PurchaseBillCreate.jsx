import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const PurchaseBillCreate = () => {
  const { activeBusiness } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('bank');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(activeBusiness?.settings?.termsAndConditions || '');
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState([
    { productId: '', name: '', hsnSacCode: '', quantity: 1, rate: 0, taxRate: 18, unit: 'PCS', discountPercent: 0, total: 0 }
  ]);

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const [supRes, prodRes] = await Promise.allSettled([
        api.get('/suppliers?limit=200'),
        api.get('/products?limit=200')
      ]);
      if (supRes.status === 'fulfilled' && supRes.value?.data?.success) {
        setSuppliers(supRes.value.data.data);
      }
      if (prodRes.status === 'fulfilled' && prodRes.value?.data?.success) {
        setProducts(prodRes.value.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load suppliers and products', 'error');
    }
  };

  const handleSupplierChange = (e) => {
    const supId = e.target.value;
    setSelectedSupplierId(supId);
    const found = suppliers.find((s) => s._id === supId);
    setSelectedSupplier(found || null);

    if (found?.creditDays) {
      const d = new Date();
      d.setDate(d.getDate() + found.creditDays);
      setDueDate(d.toISOString().split('T')[0]);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    if (field === 'productId') {
      const prod = products.find((p) => p._id === value);
      if (prod) {
        current.name = prod.name;
        current.hsnSacCode = prod.hsnSacCode || '';
        current.rate = prod.purchasePrice || 0;
        current.taxRate = prod.taxRate || 18;
        current.unit = prod.unitId?.symbol || 'PCS';
      }
    }

    const qty = Number(current.quantity) || 0;
    const rate = Number(current.rate) || 0;
    const disc = Number(current.discountPercent) || 0;
    const baseAmt = qty * rate;
    const discountAmt = (baseAmt * disc) / 100;
    current.total = baseAmt - discountAmt;

    updated[index] = current;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { productId: '', name: '', hsnSacCode: '', quantity: 1, rate: 0, taxRate: 18, unit: 'PCS', discountPercent: 0, total: 0 }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const totalTax = items.reduce((sum, item) => {
    const amt = Number(item.total) || 0;
    const rate = Number(item.taxRate) || 0;
    if (isTaxInclusive) {
      const taxable = amt / (1 + rate / 100);
      return sum + (amt - taxable);
    } else {
      return sum + (amt * rate) / 100;
    }
  }, 0);

  const rawGrandTotal = isTaxInclusive ? subtotal : subtotal + totalTax;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      addToast('Please select a supplier', 'warning');
      return;
    }

    const validItems = items.filter((i) => i.name && i.quantity > 0 && i.rate >= 0);
    if (validItems.length === 0) {
      addToast('Please add at least one valid line item', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/purchases/bills', {
        supplierId: selectedSupplierId,
        supplierInvoiceNo,
        billDate,
        dueDate: dueDate || null,
        items: validItems,
        isTaxInclusive,
        paidAmount: Number(paidAmount) || 0,
        paymentMode,
        terms,
        notes
      });

      if (res.data.success) {
        addToast('Purchase Bill recorded, stock added & ledger posted!', 'success');
        navigate('/purchases/bills');
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to record purchase bill', 'error');
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
            Record Inward Purchase Bill
          </h4>
          <p className="text-muted small mb-0">
            Record supplier invoice, replenish warehouse stock, and log Input Tax Credit (ITC)
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm text-nowrap"
          onClick={() => navigate('/purchases/bills')}
        >
          <i className="bi bi-arrow-left me-1"></i> Back to Purchase Bills
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Supplier & Bill Date Info */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <label className="form-label">Select Supplier*</label>
            <select
              className="form-select fw-bold"
              value={selectedSupplierId}
              onChange={handleSupplierChange}
              required
            >
              <option value="">-- Choose Supplier --</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.gstin ? `[GSTIN: ${s.gstin}]` : ''} - {s.billingAddress?.state || 'State'}
                </option>
              ))}
            </select>
            {selectedSupplier && (
              <div className="small text-muted mt-1">
                State: <strong>{selectedSupplier.billingAddress?.state || 'N/A'}</strong> | Balance: <strong>₹{fmt(selectedSupplier.currentBalance)}</strong>
              </div>
            )}
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label">Supplier Invoice Ref #*</label>
            <input
              type="text"
              className="form-control font-mono fw-bold"
              placeholder="e.g. INV-99824"
              value={supplierInvoiceNo}
              onChange={(e) => setSupplierInvoiceNo(e.target.value)}
              required
            />
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label">Bill Date*</label>
            <input
              type="date"
              className="form-control"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              required
            />
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label">Payment Due Date</label>
            <input
              type="date"
              className="form-control"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="col-6 col-md-1 d-flex align-items-end">
            <button
              type="button"
              className={`btn btn-sm w-100 fw-bold ${isTaxInclusive ? 'btn-success' : 'btn-outline-secondary bg-white'}`}
              onClick={() => setIsTaxInclusive(!isTaxInclusive)}
              title="Toggle Tax Inclusive / Exclusive"
              style={{ height: '38px' }}
            >
              {isTaxInclusive ? 'Incl.' : 'Excl.'}
            </button>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="table-responsive mb-3 border rounded">
          <table className="table table-bordered align-middle mb-0">
            <thead className="bg-light">
              <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ width: '35%' }}>Product / Purchased Item</th>
                <th style={{ width: '12%' }}>HSN/SAC</th>
                <th style={{ width: '10%' }}>Qty</th>
                <th style={{ width: '15%' }}>Cost Rate (₹)</th>
                <th style={{ width: '12%' }}>GST % (ITC)</th>
                <th style={{ width: '13%' }}>Amount (₹)</th>
                <th style={{ width: '3%' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <select
                      className="form-select form-select-sm mb-1 fw-bold"
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                    >
                      <option value="">-- Select Product or Type --</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} (In Stock: {p.currentStock} {p.unitId?.symbol || 'PCS'})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Item Description"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm font-mono"
                      placeholder="HSN"
                      value={item.hsnSacCode}
                      onChange={(e) => handleItemChange(idx, 'hsnSacCode', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm font-mono text-center fw-bold"
                      value={item.quantity}
                      min="1"
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control form-control-sm font-mono text-end fw-bold"
                      value={item.rate}
                      onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={item.taxRate}
                      onChange={(e) => handleItemChange(idx, 'taxRate', Number(e.target.value))}
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </td>
                  <td className="text-end fw-bold font-mono">
                    ₹{fmt(item.total)}
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger p-0"
                      onClick={() => removeItemRow(idx)}
                      disabled={items.length === 1}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="button" className="btn btn-outline-primary btn-sm mb-4" onClick={addItemRow}>
          <i className="bi bi-plus-circle me-1"></i> Add Another Item
        </button>

        {/* Bottom Section: Payment, Notes & Calculation */}
        <div className="row g-4">
          <div className="col-12 col-md-6">
            <div className="mb-3">
              <label className="form-label">Purchase Remarks / Transport Details</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Gate inward entry number, delivery challan reference..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

            {/* Immediate Payment Option */}
            <div className="p-3 bg-light border rounded">
              <h6 className="fw-bold small mb-2 text-dark">Record Immediate Outward Payment (Optional)</h6>
              <div className="row g-2">
                <div className="col-6">
                  <label className="small text-muted">Paid Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-sm font-mono fw-bold"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <label className="small text-muted">Payment Mode</label>
                  <select
                    className="form-select form-select-sm fw-semibold"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option value="bank">Bank Transfer / NEFT</option>
                    <option value="upi">UPI / QR</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Calculations Totals Card */}
          <div className="col-12 col-md-6">
            <div className="card p-3 bg-light border">
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Taxable Subtotal:</span>
                <span className="fw-bold font-mono text-dark">₹{fmt(subtotal)}</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Input Tax Credit (GST):</span>
                <span className="fw-bold font-mono text-primary">+₹{fmt(totalTax)}</span>
              </div>
              {roundOff !== 0 && (
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">Round Off:</span>
                  <span className="font-mono text-dark">₹{fmt(roundOff)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between py-2 border-top border-bottom my-2">
                <span className="fw-extrabold fs-5">TOTAL BILL AMOUNT:</span>
                <span className="fw-extrabold fs-5 text-primary font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
              {paidAmount > 0 && (
                <div className="d-flex justify-content-between py-1 text-danger fw-bold">
                  <span>Balance Payable:</span>
                  <span className="font-mono">₹{fmt(Math.max(0, grandTotal - paidAmount))}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary-zenith py-2 mt-3 w-100 justify-content-center fw-bold fs-6 shadow-sm"
                disabled={loading}
              >
                {loading ? 'Recording Bill & Adding Stock...' : 'Save Purchase Bill & Add Stock'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
