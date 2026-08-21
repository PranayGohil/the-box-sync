import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const InvoiceCreate = () => {
  const { activeBusiness } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('cash');
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
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers?limit=200'),
        api.get('/products?limit=200')
      ]);
      if (custRes.data.success) setCustomers(custRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load customers and products', 'error');
    }
  };

  const handleCustomerChange = (e) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    const found = customers.find((c) => c._id === custId);
    setSelectedCustomer(found || null);

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
        current.rate = prod.sellingPrice || 0;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      addToast('Please select a customer', 'warning');
      return;
    }

    const validItems = items.filter((i) => i.name && i.quantity > 0 && i.rate >= 0);
    if (validItems.length === 0) {
      addToast('Please add at least one valid line item', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/sales/invoices', {
        customerId: selectedCustomerId,
        invoiceDate,
        dueDate: dueDate || null,
        items: validItems,
        isTaxInclusive,
        paidAmount: Number(paidAmount) || 0,
        paymentMode,
        terms,
        notes
      });

      if (res.data.success) {
        addToast('GST Invoice created and finalized!', 'success');
        navigate('/sales/invoices');
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to create invoice', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-zenith p-4 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1">Create GST Tax Invoice</h4>
          <p className="text-muted small mb-0">Direct B2B/B2C billing with inventory stock sync & double-entry posting</p>
        </div>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/sales/invoices')}>
          Back to Invoices
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Customer & Invoice Date Info */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-5">
            <label className="form-label">Select Customer*</label>
            <select
              className="form-select fw-bold"
              value={selectedCustomerId}
              onChange={handleCustomerChange}
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.gstin ? `[GSTIN: ${c.gstin}]` : ''} - {c.billingAddress?.state || 'Maharashtra'}
                </option>
              ))}
            </select>
            {selectedCustomer && (
              <div className="small text-muted mt-1">
                State: <strong>{selectedCustomer.billingAddress?.state}</strong> | Type: <strong>{selectedCustomer.customerType}</strong> | Bal: <strong>₹{selectedCustomer.currentBalance?.toFixed(2)}</strong>
              </div>
            )}
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label">Invoice Date*</label>
            <input
              type="date"
              className="form-control"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              required
            />
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              className="form-control"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-1 d-flex align-items-end">
            <button
              type="button"
              className={`btn btn-sm w-100 ${isTaxInclusive ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={() => setIsTaxInclusive(!isTaxInclusive)}
              title="Toggle Tax Inclusive / Exclusive"
            >
              {isTaxInclusive ? 'Incl.' : 'Excl.'}
            </button>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="table-responsive mb-3 border rounded">
          <table className="table table-bordered align-middle mb-0">
            <thead className="bg-light">
              <tr style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ width: '35%' }}>Product / Item</th>
                <th style={{ width: '12%' }}>HSN/SAC</th>
                <th style={{ width: '10%' }}>Qty</th>
                <th style={{ width: '15%' }}>Rate (₹)</th>
                <th style={{ width: '12%' }}>GST %</th>
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
                      <option value="">-- Select or type custom item --</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} (Stock: {p.currentStock} {p.unitId?.symbol || 'PCS'})
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
                    ₹{item.total?.toFixed(2)}
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

        {/* Bottom Section: Notes, Payment & Summary Breakdown */}
        <div className="row g-4">
          <div className="col-12 col-md-6">
            <div className="mb-3">
              <label className="form-label">Terms & Conditions</label>
              <textarea
                className="form-control"
                rows="2"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
              ></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label">Internal Notes / Transport Remarks</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Optional delivery details, vehicle number, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
            {/* Immediate Payment Option */}
            <div className="p-3 bg-light border rounded">
              <h6 className="fw-bold small mb-2">Record Immediate Payment Receipt (Optional)</h6>
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
                    className="form-select form-select-sm"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Calculations Totals */}
          <div className="col-12 col-md-6">
            <div className="card p-3 bg-light border">
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Taxable Subtotal:</span>
                <span className="fw-bold font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Total GST Tax:</span>
                <span className="fw-bold font-mono text-primary">+₹{totalTax.toFixed(2)}</span>
              </div>
              {roundOff !== 0 && (
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">Round Off:</span>
                  <span className="font-mono">₹{roundOff.toFixed(2)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between py-2 border-top border-bottom my-2">
                <span className="fw-extrabold fs-5">GRAND TOTAL:</span>
                <span className="fw-extrabold fs-5 text-primary font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
              {paidAmount > 0 && (
                <div className="d-flex justify-content-between py-1 text-danger fw-bold">
                  <span>Balance Due:</span>
                  <span className="font-mono">₹{Math.max(0, grandTotal - paidAmount).toFixed(2)}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary-zenith py-2 mt-3 w-100 justify-content-center fw-bold fs-6"
                disabled={loading}
              >
                {loading ? 'Creating & Finalizing Invoice...' : 'Save & Finalize GST Invoice'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
