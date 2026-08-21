import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const PurchaseOrderCreate = () => {
  const { activeBusiness } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);
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
      const [supRes, prodRes, profileRes] = await Promise.allSettled([
        api.get('/suppliers?limit=200'),
        api.get('/products?limit=200'),
        api.get('/businesses/profile')
      ]);

      if (supRes.status === 'fulfilled' && supRes.value?.data?.success) {
        setSuppliers(supRes.value.data.data);
      }
      if (prodRes.status === 'fulfilled' && prodRes.value?.data?.success) {
        setProducts(prodRes.value.data.data);
      }

      let whList = [];
      if (profileRes.status === 'fulfilled' && profileRes.value?.data?.data?.warehouses) {
        whList = profileRes.value.data.data.warehouses;
      }
      if (!whList || whList.length === 0) {
        whList = [{ _id: 'main', name: 'Main Warehouse', isDefault: true }];
      }
      setWarehouses(whList);
      if (whList.length > 0) {
        setSelectedWarehouseId(whList[0]._id);
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

    // Default expected delivery: 10 days from now
    const d = new Date();
    d.setDate(d.getDate() + 10);
    setExpectedDate(d.toISOString().split('T')[0]);
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
      const res = await api.post('/purchases/orders', {
        supplierId: selectedSupplierId,
        warehouseId: selectedWarehouseId && selectedWarehouseId !== 'main' ? selectedWarehouseId : undefined,
        date: poDate,
        expectedDate: expectedDate || null,
        items: validItems,
        isTaxInclusive,
        terms,
        notes
      });

      if (res.data.success) {
        addToast('Purchase Order issued successfully!', 'success');
        navigate('/purchases/orders');
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to create purchase order', 'error');
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
            Create Purchase Order (PO)
          </h4>
          <p className="text-muted small mb-0">
            Issue formal procurement order to vendor with warehouse delivery scheduling
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm text-nowrap"
          onClick={() => navigate('/purchases/orders')}
        >
          <i className="bi bi-arrow-left me-1"></i> Back to Purchase Orders
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Supplier & Warehouse Info */}
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
            <label className="form-label">Receiving Warehouse*</label>
            <select
              className="form-select fw-semibold"
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              required
            >
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name} {w.isDefault ? '(Primary)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label">PO Date*</label>
            <input
              type="date"
              className="form-control"
              value={poDate}
              onChange={(e) => setPoDate(e.target.value)}
              required
            />
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label">Expected Delivery</label>
            <input
              type="date"
              className="form-control"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
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
                <th style={{ width: '35%' }}>Product / Description</th>
                <th style={{ width: '12%' }}>HSN/SAC</th>
                <th style={{ width: '10%' }}>Qty</th>
                <th style={{ width: '15%' }}>Cost Rate (₹)</th>
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
                      <option value="">-- Select Product --</option>
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

        {/* Bottom Section: Terms, Notes & Summary Calculation */}
        <div className="row g-4">
          <div className="col-12 col-md-6">
            <div className="mb-3">
              <label className="form-label">Delivery Terms & Payment Conditions</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Payment terms, delivery instructions, quality expectations..."
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
              ></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label">Internal Procurement Notes</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Department requirement reference, budget code..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
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
                <span className="text-muted">Estimated Inward GST:</span>
                <span className="fw-bold font-mono text-primary">+₹{fmt(totalTax)}</span>
              </div>
              {roundOff !== 0 && (
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">Round Off:</span>
                  <span className="font-mono text-dark">₹{fmt(roundOff)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between py-2 border-top border-bottom my-2">
                <span className="fw-extrabold fs-5">TOTAL ORDER VALUE:</span>
                <span className="fw-extrabold fs-5 text-primary font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary-zenith py-2 mt-3 w-100 justify-content-center fw-bold fs-6 shadow-sm"
                disabled={loading}
              >
                {loading ? 'Issuing Purchase Order...' : 'Confirm & Issue Purchase Order'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
