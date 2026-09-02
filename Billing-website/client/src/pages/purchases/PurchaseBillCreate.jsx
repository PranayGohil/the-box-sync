import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ExtraChargesSection, computeExtraCharges } from '../../components/ExtraChargesSection';

export const PurchaseBillCreate = () => {
  const { activeBusiness } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const purchaseOrderId = searchParams.get('purchaseOrderId') || searchParams.get('poId');
  const [sourceDocInfo, setSourceDocInfo] = useState(null);

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

  const [extraCharges, setExtraCharges] = useState([]);

  useEffect(() => {
    fetchFormData();
  }, []);

  // Pre-fill from Purchase Order if converting
  useEffect(() => {
    if (!purchaseOrderId) return;
    const fetchPO = async () => {
      try {
        const res = await api.get(`/purchases/orders/${purchaseOrderId}`);
        if (res.data.success) {
          const po = res.data.data;
          setSourceDocInfo({ type: 'purchase_order', number: po.poNo, id: po._id });
          setSelectedSupplierId(po.supplierId?._id || po.supplierId || '');
          setSelectedSupplier(po.supplierId || null);
          setSupplierInvoiceNo(po.poNo ? `PO-${po.poNo}` : '');
          if (po.items && po.items.length > 0) {
            setItems(
              po.items.map((it) => ({
                productId: it.productId?._id || it.productId || '',
                name: it.name || '',
                hsnSacCode: it.hsnSacCode || '',
                quantity: it.quantity || 1,
                rate: it.rate || 0,
                taxRate: it.taxRate || 0,
                unit: it.unit || 'PCS',
                discountPercent: it.discountPercent || 0,
                total: it.total || (it.quantity * it.rate)
              }))
            );
          }
          if (po.extraCharges && po.extraCharges.length > 0) {
            setExtraCharges(po.extraCharges);
          }
          if (po.notes) setNotes(po.notes);
          if (po.terms) setTerms(po.terms);
          if (po.isTaxInclusive !== undefined) setIsTaxInclusive(po.isTaxInclusive);
          addToast(`Loaded line items and details from Purchase Order #${po.poNo}`, 'success');
        }
      } catch (err) {
        console.error(err);
        addToast('Failed to load Purchase Order data', 'error');
      }
    };
    fetchPO();
  }, [purchaseOrderId]);

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

  const addExtraCharge = () => {
    setExtraCharges([
      ...extraCharges,
      { name: '', rate: 0, type: 'amount', isDeduction: false }
    ]);
  };

  const removeExtraCharge = (index) => {
    setExtraCharges(extraCharges.filter((_, idx) => idx !== index));
  };

  const handleExtraChargeChange = (index, field, value) => {
    const updated = [...extraCharges];
    const current = { ...updated[index], [field]: value };
    if (field === 'name' && updated[index].isDeduction === undefined) {
      current.isDeduction = /tds|discount|less|deduct/i.test(value);
    }
    updated[index] = current;
    setExtraCharges(updated);
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

  const {
    calculatedExtraCharges,
    totalExtraAdditions,
    totalExtraDeductions,
    validExtraCharges
  } = computeExtraCharges(extraCharges, subtotal);

  const baseAmount = isTaxInclusive ? subtotal : subtotal + totalTax;
  const rawGrandTotal = Math.max(0, baseAmount + totalExtraAdditions - totalExtraDeductions);
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));

  // GST Determination & Breakdown
  const myStateCode = activeBusiness?.stateCode || '27';
  const supplierStateCode = selectedSupplier?.address?.stateCode || selectedSupplier?.billingAddress?.stateCode || myStateCode;
  const isInterState = String(myStateCode).trim() !== String(supplierStateCode).trim();
  const cgstAmount = isInterState ? 0 : totalTax / 2;
  const sgstAmount = isInterState ? 0 : totalTax / 2;
  const igstAmount = isInterState ? totalTax : 0;

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
        extraCharges: validExtraCharges,
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
    <div className="card-zenith p-3 p-sm-4 mb-4">
      {/* 1. Page Header */}
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
          className="btn btn-outline-secondary btn-sm align-self-stretch align-self-sm-auto text-nowrap"
          onClick={() => navigate('/purchases/bills')}
        >
          <i className="bi bi-arrow-left me-1"></i> Back to Purchase Bills
        </button>
      </div>

      {/* Conversion Banner */}
      {sourceDocInfo && (
        <div className="alert alert-info py-2 px-3 d-flex align-items-center justify-content-between mb-4 shadow-sm">
          <div className="d-flex align-items-center gap-2 small">
            <i className="bi bi-link-45deg fs-5 text-primary"></i>
            <span>
              Converting from <strong>Purchase Order #{sourceDocInfo.number}</strong>
            </span>
          </div>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">PO Pre-filled</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Supplier & Bill Date Info */}
        <div className="row g-2 g-sm-3 mb-3">
          <div className="col-12 col-lg-4">
            <label className="form-label small fw-bold mb-1">Select Supplier*</label>
            <select
              className="form-select fw-bold"
              value={selectedSupplierId}
              onChange={handleSupplierChange}
              required
            >
              <option value="">-- Choose Supplier --</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.gstin ? `[GSTIN: ${s.gstin}]` : ''} - {s.address?.city ? `${s.address.city}, ` : ''}{s.address?.state || s.billingAddress?.state || 'State'}
                </option>
              ))}
            </select>
            {selectedSupplier && (
              <div className="small text-muted mt-1 text-truncate" style={{ fontSize: '0.75rem' }}>
                Location: <strong>{selectedSupplier.address?.city ? `${selectedSupplier.address.city}, ` : ''}{selectedSupplier.address?.state || selectedSupplier.billingAddress?.state || 'N/A'}</strong> | Balance: <strong>₹{fmt(selectedSupplier.currentBalance)}</strong>
              </div>
            )}
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label small fw-bold mb-1">Supplier Invoice Ref #*</label>
            <input
              type="text"
              className="form-control form-control-sm font-mono fw-bold"
              placeholder="e.g. INV-99824"
              value={supplierInvoiceNo}
              onChange={(e) => setSupplierInvoiceNo(e.target.value)}
              required
            />
          </div>

          <div className="col-6 col-sm-3 col-lg-2">
            <label className="form-label small fw-bold mb-1">Bill Date*</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              required
            />
          </div>

          <div className="col-6 col-sm-3 col-lg-2">
            <label className="form-label small fw-bold mb-1">Payment Due Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="col-12 col-lg-1 d-flex align-items-end">
            <button
              type="button"
              className={`btn btn-sm w-100 fw-bold ${isTaxInclusive ? 'btn-success' : 'btn-outline-secondary bg-white'}`}
              onClick={() => setIsTaxInclusive(!isTaxInclusive)}
              title="Toggle Tax Inclusive / Exclusive"
              style={{ minHeight: '31px' }}
            >
              {isTaxInclusive ? 'Tax Incl.' : 'Tax Excl.'}
            </button>
          </div>
        </div>

        {/* 2. Line Items Desktop Table (>= 768px) */}
        <div className="table-responsive mb-3 border rounded d-none d-md-block">
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

        {/* 3. Mobile Line Items Card List (< 768px) */}
        <div className="d-md-none mb-3">
          {items.map((item, idx) => (
            <div key={idx} className="card p-3 mb-2 bg-light border rounded" style={{ overflow: 'hidden' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="badge bg-primary text-white font-mono" style={{ fontSize: '0.72rem' }}>Item #{idx + 1}</span>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold font-mono text-dark" style={{ fontSize: '0.95rem' }}>₹{fmt(item.total)}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger py-0 px-2"
                      onClick={() => removeItemRow(idx)}
                      title="Remove Item"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Product Select / Name */}
              <div className="mb-2">
                <label className="form-label small mb-1 fw-semibold" style={{ fontSize: '0.75rem' }}>Product / Description*</label>
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
              </div>

              {/* Qty, Rate, GST %, HSN in 2x2 grid */}
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small mb-1" style={{ fontSize: '0.75rem' }}>Purchased Qty*</label>
                  <input
                    type="number"
                    className="form-control form-control-sm font-mono text-center fw-bold"
                    value={item.quantity}
                    min="1"
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small mb-1" style={{ fontSize: '0.75rem' }}>Cost Rate (₹)*</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-sm font-mono text-end fw-bold"
                    value={item.rate}
                    onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small mb-1" style={{ fontSize: '0.75rem' }}>GST % (ITC)</label>
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
                </div>
                <div className="col-6">
                  <label className="form-label small mb-1" style={{ fontSize: '0.75rem' }}>HSN/SAC Code</label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-mono"
                    placeholder="HSN"
                    value={item.hsnSacCode}
                    onChange={(e) => handleItemChange(idx, 'hsnSacCode', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="d-flex flex-wrap gap-2 mb-4">
          <button type="button" className="btn btn-outline-primary btn-sm flex-fill flex-sm-grow-0 text-nowrap" onClick={addItemRow}>
            <i className="bi bi-plus-circle me-1"></i> Add Another Item
          </button>
          <button type="button" className="btn btn-outline-secondary btn-sm flex-fill flex-sm-grow-0 text-nowrap" onClick={addExtraCharge}>
            <i className="bi bi-plus-slash-minus me-1"></i> Add Extra Field / Charge
          </button>
        </div>

        <ExtraChargesSection
          extraCharges={extraCharges}
          calculatedExtraCharges={calculatedExtraCharges}
          onAdd={addExtraCharge}
          onRemove={removeExtraCharge}
          onChange={handleExtraChargeChange}
        />

        {/* Bottom Section: Payment, Notes & Calculation */}
        <div className="row g-3 g-md-4">
          <div className="col-12 col-md-6">
            <div className="mb-3">
              <label className="form-label small fw-bold mb-1">Purchase Remarks / Transport Details</label>
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
                <div className="col-12 col-sm-6">
                  <label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Paid Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-sm font-mono fw-bold"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="small text-muted mb-1" style={{ fontSize: '0.75rem' }}>Payment Mode</label>
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
            <div className="card p-3 p-sm-4 bg-light border rounded shadow-sm" style={{ overflow: 'hidden' }}>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Taxable Subtotal:</span>
                <span className="fw-bold font-mono text-dark">₹{fmt(subtotal)}</span>
              </div>

              {/* GST Breakdown */}
              {isInterState ? (
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted d-flex align-items-center gap-1">
                    <span>IGST Credit (Integrated):</span>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '0.65rem' }}>Inter-State</span>
                  </span>
                  <span className="fw-bold font-mono text-primary">+₹{fmt(igstAmount)}</span>
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted d-flex align-items-center gap-1">
                      <span>CGST Credit (Central):</span>
                      <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.65rem' }}>Intra-State</span>
                    </span>
                    <span className="fw-bold font-mono text-primary">+₹{fmt(cgstAmount)}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted">SGST Credit (State):</span>
                    <span className="fw-bold font-mono text-primary">+₹{fmt(sgstAmount)}</span>
                  </div>
                </>
              )}
              {calculatedExtraCharges.filter((c) => c.name?.trim()).map((c, i) => (
                <div key={i} className="d-flex justify-content-between py-1 small">
                  <span className="text-muted">{c.name} {c.type === 'percentage' ? `(${c.rate}%)` : ''}:</span>
                  <span className={`font-mono fw-semibold ${c.isDeduction ? 'text-danger' : 'text-success'}`}>
                    {c.isDeduction ? '-' : '+'}₹{fmt(c.amount)}
                  </span>
                </div>
              ))}
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
