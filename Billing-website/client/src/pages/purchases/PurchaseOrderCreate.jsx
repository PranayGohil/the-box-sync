import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ExtraChargesSection, computeExtraCharges } from '../../components/ExtraChargesSection';

export const PurchaseOrderCreate = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { activeBusiness } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [poNo, setPoNo] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);
  const [isWithoutGst, setIsWithoutGst] = useState(false);
  const [currency, setCurrency] = useState(activeBusiness?.currency || 'INR');
  const [currencySymbol, setCurrencySymbol] = useState(activeBusiness?.currencySymbol || (activeBusiness?.currency === 'USD' ? '$' : '₹'));
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(activeBusiness?.settings?.termsAndConditions || '');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  const [items, setItems] = useState([
    { productId: '', name: '', hsnSacCode: '', quantity: 1, rate: 0, taxRate: 18, unit: 'PCS', discountPercent: 0, total: 0 }
  ]);

  const [extraCharges, setExtraCharges] = useState([]);

  useEffect(() => {
    fetchFormData();
  }, []);

  useEffect(() => {
    if (id) {
      fetchPoDetails();
    }
  }, [id]);

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
      if (whList.length > 0 && !selectedWarehouseId) {
        setSelectedWarehouseId(whList[0]._id);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load form prerequisites', 'error');
    }
  };

  const fetchPoDetails = async () => {
    try {
      setInitialLoading(true);
      const res = await api.get(`/purchases/orders/${id}`);
      if (res.data.success) {
        const po = res.data.data;
        if (['completed', 'cancelled'].includes(po.status)) {
          addToast(`This purchase order is ${po.status} and cannot be edited.`, 'warning');
          navigate('/purchases/orders');
          return;
        }
        setPoNo(po.poNo || '');
        const supId = po.supplierId?._id || po.supplierId;
        setSelectedSupplierId(supId || '');
        setSelectedSupplier(po.supplierId || null);
        if (po.warehouseId) {
          const wId = po.warehouseId?._id || po.warehouseId;
          setSelectedWarehouseId(wId);
        }
        if (po.date) setPoDate(new Date(po.date).toISOString().split('T')[0]);
        if (po.expectedDeliveryDate) setExpectedDate(new Date(po.expectedDeliveryDate).toISOString().split('T')[0]);
        if (po.currency) {
          setCurrency(po.currency);
          setCurrencySymbol(po.currencySymbol || (po.currency === 'USD' ? '$' : '₹'));
        }
        setIsTaxInclusive(Boolean(po.isTaxInclusive));
        setIsWithoutGst(Boolean(po.isWithoutGst || (po.totalTax === 0 && po.items?.every(i => !i.taxRate || i.taxRate === 0))));
        setTerms(po.terms || '');
        setNotes(po.notes || '');

        if (po.items && po.items.length > 0) {
          setItems(
            po.items.map((item) => ({
              productId: item.productId?._id || item.productId || '',
              name: item.name || '',
              hsnSacCode: item.hsnSacCode || '',
              quantity: item.quantity || 1,
              rate: item.rate || 0,
              taxRate: item.taxRate || 18,
              unit: item.unit || 'PCS',
              discountPercent: item.discountPercent || 0,
              total: item.total || 0
            }))
          );
        }

        if (po.extraCharges && po.extraCharges.length > 0) {
          setExtraCharges(
            po.extraCharges.map((ch) => ({
              name: ch.name || '',
              rate: ch.rate || 0,
              type: ch.type || 'amount',
              isDeduction: Boolean(ch.isDeduction)
            }))
          );
        }
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to load purchase order details', 'error');
      navigate('/purchases/orders');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSupplierChange = (e) => {
    const supId = e.target.value;
    setSelectedSupplierId(supId);
    const found = suppliers.find((s) => s._id === supId);
    setSelectedSupplier(found || null);

    if (!expectedDate) {
      const d = new Date();
      d.setDate(d.getDate() + (found?.creditDays || 15));
      setExpectedDate(d.toISOString().split('T')[0]);
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

  const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const totalTax = isWithoutGst
    ? 0
    : items.reduce((sum, item) => {
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

  const baseAmount = isWithoutGst ? subtotal : (isTaxInclusive ? subtotal : subtotal + totalTax);
  const rawGrandTotal = Math.max(0, baseAmount + totalExtraAdditions - totalExtraDeductions);
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));

  // GST Determination & Breakdown
  const myStateCode = activeBusiness?.stateCode || '27';
  const supplierStateCode = selectedSupplier?.address?.stateCode || selectedSupplier?.billingAddress?.stateCode || myStateCode;
  const isInterState = String(myStateCode).trim() !== String(supplierStateCode).trim();
  const cgstAmount = isWithoutGst || isInterState ? 0 : totalTax / 2;
  const sgstAmount = isWithoutGst || isInterState ? 0 : totalTax / 2;
  const igstAmount = isWithoutGst || !isInterState ? 0 : totalTax;

  const sym = currencySymbol || (currency === 'USD' ? '$' : '₹');
  const fmt = (val) => {
    const locale = currency === 'USD' ? 'en-US' : 'en-IN';
    return Number(val || 0).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleCurrencyChange = (newCurr) => {
    setCurrency(newCurr);
    const newSym = newCurr === 'USD' ? '$' : '₹';
    setCurrencySymbol(newSym);
    if (newCurr === 'USD') {
      setIsWithoutGst(true);
    }
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
      const payload = {
        supplierId: selectedSupplierId,
        warehouseId: selectedWarehouseId && selectedWarehouseId !== 'main' ? selectedWarehouseId : undefined,
        date: poDate,
        expectedDeliveryDate: expectedDate || null,
        currency,
        currencySymbol: sym,
        items: validItems.map(item => ({
          ...item,
          taxRate: isWithoutGst ? 0 : item.taxRate
        })),
        extraCharges: validExtraCharges,
        isTaxInclusive: isWithoutGst ? false : isTaxInclusive,
        isWithoutGst,
        terms,
        notes
      };

      if (isEdit) {
        const res = await api.put(`/purchases/orders/${id}`, payload);
        if (res.data.success) {
          addToast('Purchase Order updated successfully!', 'success');
          navigate('/purchases/orders');
        }
      } else {
        const res = await api.post('/purchases/orders', payload);
        if (res.data.success) {
          addToast('Purchase Order issued successfully!', 'success');
          navigate('/purchases/orders');
        }
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} purchase order`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="card-zenith p-5 text-center my-4">
        <div className="spinner-border text-primary" role="status"></div>
        <div className="mt-2 text-muted small">Loading purchase order details...</div>
      </div>
    );
  }

  return (
    <div className="card-zenith p-3 p-sm-4 mb-4">
      {/* 1. Page Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            {isEdit ? `Edit Purchase Order #${poNo}` : 'Create Purchase Order (PO)'}
          </h4>
          <p className="text-muted small mb-0">
            {isEdit
              ? 'Update procurement order items, extra charges, and terms'
              : 'Issue formal procurement order to vendor with warehouse delivery scheduling'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm align-self-stretch align-self-sm-auto text-nowrap"
          onClick={() => navigate('/purchases/orders')}
        >
          <i className="bi bi-arrow-left me-1"></i> Back to PO List
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Document Configuration Bar */}
        <div className="card bg-light border p-2 mb-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            {/* Currency Selector */}
            <div className="d-flex align-items-center gap-2">
              <span className="small fw-bold text-dark text-nowrap">
                <i className="bi bi-cash-stack me-1 text-primary"></i>Currency:
              </span>
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn fw-bold px-3 ${currency === 'INR' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleCurrencyChange('INR')}
                >
                  ₹ INR (Rupees)
                </button>
                <button
                  type="button"
                  className={`btn fw-bold px-3 ${currency === 'USD' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleCurrencyChange('USD')}
                >
                  $ USD (Dollar)
                </button>
              </div>
            </div>

            {/* GST Application Switcher */}
            <div className="d-flex align-items-center gap-2">
              <span className="small fw-bold text-dark text-nowrap">GST Tax:</span>
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn fw-bold px-3 ${!isWithoutGst ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => setIsWithoutGst(false)}
                >
                  <i className="bi bi-percent me-1"></i> With GST
                </button>
                <button
                  type="button"
                  className={`btn fw-bold px-3 ${isWithoutGst ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                  onClick={() => setIsWithoutGst(true)}
                >
                  <i className="bi bi-dash-circle me-1"></i> Without GST (0% / Non-GST)
                </button>
              </div>
            </div>

            {/* Pricing Mode */}
            {!isWithoutGst ? (
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className={`btn btn-sm fw-bold ${
                    isTaxInclusive ? 'btn-info text-white' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setIsTaxInclusive(!isTaxInclusive)}
                  title="Toggle Tax Inclusive / Exclusive"
                >
                  {isTaxInclusive ? '✓ Tax Inclusive Rates' : 'Tax Exclusive Rates'}
                </button>
              </div>
            ) : (
              <span className="badge bg-warning text-dark px-2 py-1" style={{ fontSize: '0.75rem' }}>
                <i className="bi bi-info-circle me-1"></i> 0% Tax / Non-GST calculation active
              </span>
            )}
          </div>
        </div>

        {/* Supplier & Warehouse Info */}
        <div className="row g-2 g-sm-3 mb-3">
          <div className="col-12 col-lg-5">
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
                Location: <strong>{selectedSupplier.address?.city ? `${selectedSupplier.address.city}, ` : ''}{selectedSupplier.address?.state || selectedSupplier.billingAddress?.state || 'N/A'}</strong> | Balance: <strong>{sym}{fmt(selectedSupplier.currentBalance)}</strong>
              </div>
            )}
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label small fw-bold mb-1">Receiving Warehouse*</label>
            <select
              className="form-select form-select-sm fw-semibold"
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

          <div className="col-6 col-sm-3 col-lg-2">
            <label className="form-label small fw-bold mb-1">PO Date*</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={poDate}
              onChange={(e) => setPoDate(e.target.value)}
              required
            />
          </div>

          <div className="col-6 col-sm-3 col-lg-2">
            <label className="form-label small fw-bold mb-1">Expected Delivery</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
            />
          </div>
        </div>

        {/* 2. Line Items Desktop Table (>= 768px) */}
        <div className="table-responsive mb-3 border rounded d-none d-md-block">
          <table className="table table-bordered align-middle mb-0">
            <thead className="bg-light">
              <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ width: isWithoutGst ? '38%' : '32%' }}>Product / Description</th>
                <th style={{ width: '11%' }}>HSN/SAC</th>
                <th style={{ width: '9%' }}>Qty</th>
                <th style={{ width: '14%' }}>Cost Rate ({sym})</th>
                <th style={{ width: '9%' }}>Disc %</th>
                <th style={{ width: isWithoutGst ? '9%' : '10%' }}>{isWithoutGst ? 'Tax' : 'GST %'}</th>
                <th style={{ width: isWithoutGst ? '14%' : '12%' }}>Amount ({sym})</th>
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
                    <input
                      type="number"
                      step="0.1"
                      className="form-control form-control-sm font-mono text-center"
                      value={item.discountPercent || ''}
                      placeholder="0"
                      onChange={(e) => handleItemChange(idx, 'discountPercent', e.target.value)}
                    />
                  </td>
                  <td>
                    {isWithoutGst ? (
                      <span className="badge bg-secondary-subtle text-secondary w-100 py-2" style={{ fontSize: '0.75rem' }}>
                        Non-GST (0%)
                      </span>
                    ) : (
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
                    )}
                  </td>
                  <td className="text-end fw-bold font-mono">
                    {sym}{fmt(item.total)}
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
                  <span className="fw-bold font-mono text-dark" style={{ fontSize: '0.95rem' }}>{sym}{fmt(item.total)}</span>
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
              </div>

              {/* Qty, Rate, Disc, GST %, HSN in grid */}
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small mb-1" style={{ fontSize: '0.75rem' }}>Quantity*</label>
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
                  <label className="form-label small mb-1" style={{ fontSize: '0.75rem' }}>Cost Rate ({sym})*</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-sm font-mono text-end fw-bold"
                    value={item.rate}
                    onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                    required
                  />
                </div>
                <div className="col-4">
                  <label className="form-label small mb-1" style={{ fontSize: '0.75rem' }}>Disc %</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control form-control-sm font-mono text-center"
                    value={item.discountPercent || ''}
                    placeholder="0"
                    onChange={(e) => handleItemChange(idx, 'discountPercent', e.target.value)}
                  />
                </div>
                <div className="col-4">
                  <label className="form-label small mb-1" style={{ fontSize: '0.75rem' }}>Tax Rate</label>
                  {isWithoutGst ? (
                    <div className="form-control form-control-sm bg-secondary-subtle text-secondary fw-semibold text-center" style={{ fontSize: '0.78rem' }}>
                      Non-GST (0%)
                    </div>
                  ) : (
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
                  )}
                </div>
                <div className="col-4">
                  <label className="form-label small mb-1" style={{ fontSize: '0.75rem' }}>HSN Code</label>
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

        {/* Bottom Section: Terms, Notes & Summary Calculation */}
        <div className="row g-3 g-md-4">
          <div className="col-12 col-md-6">
            <div className="mb-3">
              <label className="form-label small fw-bold mb-1">Delivery Terms & Payment Conditions</label>
              <textarea
                className="form-control"
                rows="5"
                style={{ minHeight: '130px' }}
                placeholder="Payment terms, delivery instructions, quality expectations..."
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
              ></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold mb-1">Internal Procurement Notes</label>
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
            <div className="card p-3 p-sm-4 bg-light border rounded shadow-sm" style={{ overflow: 'hidden' }}>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Taxable Subtotal:</span>
                <span className="fw-bold font-mono text-dark">{sym}{fmt(subtotal)}</span>
              </div>

              {/* GST Breakdown */}
              {isWithoutGst ? (
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted d-flex align-items-center gap-1">
                    <span>Tax / GST:</span>
                    <span className="badge bg-warning-subtle text-dark border border-warning-subtle" style={{ fontSize: '0.65rem' }}>Without GST</span>
                  </span>
                  <span className="fw-bold font-mono text-muted">{sym}0.00 (Exempt)</span>
                </div>
              ) : isInterState ? (
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted d-flex align-items-center gap-1">
                    <span>Estimated IGST:</span>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '0.65rem' }}>Inter-State</span>
                  </span>
                  <span className="fw-bold font-mono text-primary">+{sym}{fmt(igstAmount)}</span>
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted d-flex align-items-center gap-1">
                      <span>Estimated CGST:</span>
                      <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.65rem' }}>Intra-State</span>
                    </span>
                    <span className="fw-bold font-mono text-primary">+{sym}{fmt(cgstAmount)}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted">Estimated SGST:</span>
                    <span className="fw-bold font-mono text-primary">+{sym}{fmt(sgstAmount)}</span>
                  </div>
                </>
              )}
              {calculatedExtraCharges.filter((c) => c.name?.trim()).map((c, i) => (
                <div key={i} className="d-flex justify-content-between py-1 small">
                  <span className="text-muted">{c.name} {c.type === 'percentage' ? `(${c.rate}%)` : ''}:</span>
                  <span className={`font-mono fw-semibold ${c.isDeduction ? 'text-danger' : 'text-success'}`}>
                    {c.isDeduction ? '-' : '+'}{sym}{fmt(c.amount)}
                  </span>
                </div>
              ))}
              {roundOff !== 0 && (
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">Round Off:</span>
                  <span className="font-mono text-dark">{roundOff > 0 ? `+${sym}${fmt(roundOff)}` : `-${sym}${fmt(Math.abs(roundOff))}`}</span>
                </div>
              )}
              <div className="d-flex justify-content-between py-2 border-top border-bottom my-2">
                <span className="fw-extrabold fs-5">TOTAL ORDER VALUE:</span>
                <span className="fw-extrabold fs-5 text-primary font-mono">{sym}{fmt(grandTotal)}</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary-zenith py-2 mt-3 w-100 justify-content-center fw-bold fs-6 shadow-sm"
                disabled={loading}
              >
                {loading
                  ? isEdit
                    ? 'Updating Purchase Order...'
                    : 'Issuing Purchase Order...'
                  : isEdit
                  ? 'Update Purchase Order'
                  : 'Confirm & Issue Purchase Order'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
