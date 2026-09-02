import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ShippingAddressSection } from '../../components/ShippingAddressSection';

export const DeliveryChallanCreate = () => {
  const { activeBusiness } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [challanDate, setChallanDate] = useState(new Date().toISOString().split('T')[0]);
  const [transporterName, setTransporterName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [ewayBillNo, setEwayBillNo] = useState('');
  const [stockPolicy, setStockPolicy] = useState(activeBusiness?.settings?.dcStockPolicy || 'DEDUCT');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(activeBusiness?.settings?.termsAndConditions || '');
  const [loading, setLoading] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    stateCode: '',
    pincode: '',
    country: 'India'
  });
  const [sameAsBilling, setSameAsBilling] = useState(true);

  const [items, setItems] = useState([
    { productId: '', name: '', hsnSacCode: '', quantity: 1, rate: 0, unit: 'PCS', total: 0 }
  ]);

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const [custRes, prodRes, profileRes] = await Promise.allSettled([
        api.get('/customers?limit=200'),
        api.get('/products?limit=200'),
        api.get('/businesses/profile')
      ]);

      if (custRes.status === 'fulfilled' && custRes.value?.data?.success) {
        setCustomers(custRes.value.data.data);
      }

      if (prodRes.status === 'fulfilled' && prodRes.value?.data?.success) {
        setProducts(prodRes.value.data.data);
      }

      let whList = [];
      if (profileRes.status === 'fulfilled' && profileRes.value?.data?.data?.warehouses) {
        whList = profileRes.value.data.data.warehouses;
      }

      // If no custom warehouses created yet, provide Main Warehouse default
      if (!whList || whList.length === 0) {
        whList = [{ _id: 'main', name: 'Main Warehouse', isDefault: true }];
      }

      setWarehouses(whList);
      if (whList.length > 0) {
        setSelectedWarehouseId(whList[0]._id);
      }
    } catch (err) {
      console.error('[DeliveryChallanCreate fetch error]:', err);
      // Fallback default warehouse
      setWarehouses([{ _id: 'main', name: 'Main Warehouse', isDefault: true }]);
    }
  };

  const handleCustomerChange = (e) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    const found = customers.find((c) => c._id === custId);
    setSelectedCustomer(found || null);

    if (found?.shippingAddress && (found.shippingAddress.street || found.shippingAddress.city)) {
      setShippingAddress({
        street: found.shippingAddress.street || '',
        city: found.shippingAddress.city || '',
        state: found.shippingAddress.state || found.billingAddress?.state || '',
        stateCode: found.shippingAddress.stateCode || found.billingAddress?.stateCode || '',
        pincode: found.shippingAddress.pincode || '',
        country: found.shippingAddress.country || 'India'
      });
      setSameAsBilling(false);
    } else if (found?.billingAddress) {
      setShippingAddress({
        street: found.billingAddress.street || '',
        city: found.billingAddress.city || '',
        state: found.billingAddress.state || '',
        stateCode: found.billingAddress.stateCode || '',
        pincode: found.billingAddress.pincode || '',
        country: found.billingAddress.country || 'India'
      });
      setSameAsBilling(true);
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
        current.unit = prod.unitId?.symbol || 'PCS';
      }
    }

    const qty = Number(current.quantity) || 0;
    const rate = Number(current.rate) || 0;
    current.total = qty * rate;

    updated[index] = current;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { productId: '', name: '', hsnSacCode: '', quantity: 1, rate: 0, unit: 'PCS', total: 0 }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const totalUnits = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const totalGoodsValue = items.reduce((sum, i) => sum + (Number(i.total) || 0), 0);

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      addToast('Please select a customer', 'warning');
      return;
    }

    const validItems = items.filter((i) => i.name && i.quantity > 0);
    if (validItems.length === 0) {
      addToast('Please add at least one valid line item', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/sales/challans', {
        customerId: selectedCustomerId,
        warehouseId: selectedWarehouseId && selectedWarehouseId !== 'main' ? selectedWarehouseId : undefined,
        date: challanDate,
        items: validItems,
        stockPolicyApplied: stockPolicy,
        shippingAddress: sameAsBilling ? (selectedCustomer?.billingAddress || shippingAddress) : shippingAddress,
        transporterDetails: {
          transporterName,
          vehicleNo,
          ewayBillNo
        },
        terms,
        notes
      });

      if (res.data.success) {
        addToast('Delivery Challan generated and stock adjusted!', 'success');
        navigate('/sales/challans');
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to create delivery challan', 'error');
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
            Generate Delivery Challan (DC)
          </h4>
          <p className="text-muted small mb-0">
            Dispatch goods with vehicle tracking, stock ledger policy, and E-Way Bill documentation
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm align-self-stretch align-self-sm-auto text-nowrap"
          onClick={() => navigate('/sales/challans')}
        >
          <i className="bi bi-arrow-left me-1"></i> Back to Challans
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Customer & Warehouse Info */}
        <div className="row g-2 g-sm-3 mb-3">
          <div className="col-12 col-lg-5">
            <label className="form-label small fw-bold mb-1">Select Customer / Consignee*</label>
            <select
              className="form-select fw-bold"
              value={selectedCustomerId}
              onChange={handleCustomerChange}
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.gstin ? `[GSTIN: ${c.gstin}]` : ''} - {c.billingAddress?.city ? `${c.billingAddress.city}, ` : ''}{c.billingAddress?.state || 'State'}
                </option>
              ))}
            </select>
            {selectedCustomer && (
              <div className="small text-muted mt-1 text-truncate" style={{ fontSize: '0.75rem' }}>
                Ship to: <strong>{selectedCustomer.shippingAddress?.address || selectedCustomer.billingAddress?.address || 'Same as billing'}</strong>
              </div>
            )}
          </div>

          <div className="col-12 col-sm-6 col-lg-4">
            <label className="form-label small fw-bold mb-1">Dispatch Warehouse*</label>
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

          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label small fw-bold mb-1">Challan Date*</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={challanDate}
              onChange={(e) => setChallanDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Shipping Address Section */}
        {selectedCustomer && (
          <ShippingAddressSection
            billingAddress={selectedCustomer.billingAddress}
            shippingAddress={shippingAddress}
            onChange={setShippingAddress}
            sameAsBilling={sameAsBilling}
            setSameAsBilling={setSameAsBilling}
            title="Destination / Delivery Address"
          />
        )}

        {/* Transportation & Logistics Row */}
        <div className="row g-2 g-sm-3 mb-3 p-3 bg-light border rounded">
          <div className="col-12 col-sm-4">
            <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Transporter / Courier Name</label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="e.g. VRL Logistics, DTDC"
              value={transporterName}
              onChange={(e) => setTransporterName(e.target.value)}
            />
          </div>

          <div className="col-6 col-sm-4">
            <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Vehicle / Truck Number</label>
            <input
              type="text"
              className="form-control form-control-sm font-mono text-uppercase"
              placeholder="e.g. MH-12-AB-1234"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
            />
          </div>

          <div className="col-6 col-sm-4">
            <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>E-Way Bill Number (Optional)</label>
            <input
              type="text"
              className="form-control form-control-sm font-mono"
              placeholder="12-digit E-Way Bill"
              value={ewayBillNo}
              onChange={(e) => setEwayBillNo(e.target.value)}
            />
          </div>
        </div>

        {/* Stock Policy Selector */}
        <div className="row g-2 g-sm-3 mb-3 align-items-center">
          <div className="col-12 col-md-6">
            <label className="form-label small fw-bold mb-1">Inventory Stock Policy</label>
            <select
              className="form-select form-select-sm fw-semibold"
              value={stockPolicy}
              onChange={(e) => setStockPolicy(e.target.value)}
            >
              <option value="DEDUCT">Deduct Stock Immediately (Standard Dispatch)</option>
              <option value="RESERVE">Reserve Stock until GST Invoice is Generated</option>
              <option value="NONE">No Stock Ledger Impact (Job Work / Sample)</option>
            </select>
          </div>
          <div className="col-12 col-md-6">
            <div className="small text-muted p-2 bg-light border rounded mt-1 mt-md-3" style={{ fontSize: '0.75rem' }}>
              {stockPolicy === 'DEDUCT' && '✓ Automatically posts outward movement in inventory stock ledger.'}
              {stockPolicy === 'RESERVE' && 'ℹ️ Keeps physical stock reserved to prevent overselling on POS.'}
              {stockPolicy === 'NONE' && '⚠️ Inventory quantities will not be adjusted on save.'}
            </div>
          </div>
        </div>

        {/* 2. Line Items Desktop Table (>= 768px) */}
        <div className="table-responsive mb-3 border rounded d-none d-md-block">
          <table className="table table-bordered align-middle mb-0">
            <thead className="bg-light">
              <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ width: '38%' }}>Product / Description</th>
                <th style={{ width: '15%' }}>HSN/SAC</th>
                <th style={{ width: '12%' }}>Dispatched Qty</th>
                <th style={{ width: '15%' }}>Unit Price (₹)</th>
                <th style={{ width: '15%' }}>Goods Value (₹)</th>
                <th style={{ width: '5%' }}></th>
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
                    />
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
                  <option value="">-- Select Product --</option>
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
              </div>

              {/* Qty, Rate, HSN in 2x2 grid */}
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small mb-1" style={{ fontSize: '0.75rem' }}>Dispatched Qty*</label>
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
                  <label className="form-label small mb-1" style={{ fontSize: '0.75rem' }}>Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-sm font-mono text-end fw-bold"
                    value={item.rate}
                    onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                  />
                </div>
                <div className="col-12">
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
        </div>

        {/* Bottom Section: Remarks & Summary Card */}
        <div className="row g-3 g-md-4">
          <div className="col-12 col-md-6">
            <div className="mb-3">
              <label className="form-label small fw-bold mb-1">Dispatch Remarks / Instructions</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Receiver contact person, gate entry notes, handling instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Right Calculation Totals Card */}
          <div className="col-12 col-md-6">
            <div className="card p-3 p-sm-4 bg-light border rounded shadow-sm" style={{ overflow: 'hidden' }}>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Total Quantity Dispatched:</span>
                <span className="fw-bold font-mono text-dark">{totalUnits} Units</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Total Declared Goods Value:</span>
                <span className="fw-bold font-mono text-primary">₹{fmt(totalGoodsValue)}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-top mt-2 pt-2">
                <span className="text-muted">Inventory Policy:</span>
                <span className="badge bg-primary text-uppercase">{stockPolicy}</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary-zenith py-2 mt-3 w-100 justify-content-center fw-bold fs-6 shadow-sm"
                disabled={loading}
              >
                {loading ? 'Dispatching & Saving...' : 'Dispatch Goods & Generate Challan'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
