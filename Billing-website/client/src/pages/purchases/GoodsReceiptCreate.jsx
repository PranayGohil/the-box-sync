import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const GoodsReceiptCreate = () => {
  const { activeBusiness } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryChallanNo, setDeliveryChallanNo] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState([
    { productId: '', name: '', quantity: 1, unit: 'PCS', batchNumber: '', expiryDate: '', notes: '' }
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
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    if (field === 'productId') {
      const prod = products.find((p) => p._id === value);
      if (prod) {
        current.name = prod.name;
        current.unit = prod.unitId?.symbol || 'PCS';
      }
    }

    updated[index] = current;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { productId: '', name: '', quantity: 1, unit: 'PCS', batchNumber: '', expiryDate: '', notes: '' }
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const totalUnits = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      addToast('Please select a supplier', 'warning');
      return;
    }

    const validItems = items.filter((i) => i.name && i.quantity > 0);
    if (validItems.length === 0) {
      addToast('Please add at least one valid line item with quantity > 0', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/purchases/grn', {
        supplierId: selectedSupplierId,
        warehouseId: selectedWarehouseId && selectedWarehouseId !== 'main' ? selectedWarehouseId : undefined,
        date: receiptDate,
        deliveryChallanNo,
        vehicleNo,
        items: validItems,
        notes
      });

      if (res.data.success) {
        addToast('Goods Receipt Note recorded and stock added into warehouse!', 'success');
        navigate('/purchases/grn');
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to record GRN', 'error');
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
            Record Goods Receipt Note (GRN)
          </h4>
          <p className="text-muted small mb-0">
            Physical gate inward inspection, batch tagging, and warehouse stock addition
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm align-self-stretch align-self-sm-auto text-nowrap"
          onClick={() => navigate('/purchases/grn')}
        >
          <i className="bi bi-arrow-left me-1"></i> Back to GRNs
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Supplier & Warehouse Info */}
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
                  {s.name} {s.gstin ? `[GSTIN: ${s.gstin}]` : ''}
                </option>
              ))}
            </select>
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
            <label className="form-label small fw-bold mb-1">Receipt Date*</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              required
            />
          </div>

          <div className="col-6 col-sm-3 col-lg-3">
            <label className="form-label small fw-bold mb-1">Vendor Challan / Ref #</label>
            <input
              type="text"
              className="form-control form-control-sm font-mono"
              placeholder="e.g. DC-4401"
              value={deliveryChallanNo}
              onChange={(e) => setDeliveryChallanNo(e.target.value)}
            />
          </div>
        </div>

        {/* Transporter / Vehicle Row */}
        <div className="row g-2 g-sm-3 mb-3 p-3 bg-light border rounded">
          <div className="col-12 col-sm-6">
            <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Vehicle / Delivery Truck Number</label>
            <input
              type="text"
              className="form-control form-control-sm font-mono text-uppercase"
              placeholder="e.g. MH-12-DE-9081"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
            />
          </div>
          <div className="col-12 col-sm-6">
            <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Gate Inward Notes / Inspection Sign-off</label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="e.g. Inspected by Security / Store Keeper"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* 2. Line Items Desktop Table (>= 768px) */}
        <div className="table-responsive mb-3 border rounded d-none d-md-block">
          <table className="table table-bordered align-middle mb-0">
            <thead className="bg-light">
              <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ width: '40%' }}>Product / Description</th>
                <th style={{ width: '15%' }} className="text-center">Received Qty</th>
                <th style={{ width: '20%' }}>Batch / Lot # (Optional)</th>
                <th style={{ width: '20%' }}>Expiry Date (Optional)</th>
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
                          {p.name} (Current Stock: {p.currentStock} {p.unitId?.symbol || 'PCS'})
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
                      type="number"
                      className="form-control form-control-sm font-mono text-center fw-bold"
                      value={item.quantity}
                      min="1"
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm font-mono"
                      placeholder="Batch #"
                      value={item.batchNumber}
                      onChange={(e) => handleItemChange(idx, 'batchNumber', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={item.expiryDate}
                      onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                    />
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
                  <span className="fw-bold font-mono text-dark" style={{ fontSize: '0.9rem' }}>{item.quantity} {item.unit}</span>
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
                      {p.name} (Current Stock: {p.currentStock} {p.unitId?.symbol || 'PCS'})
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

              {/* Qty, Batch, Expiry in grid */}
              <div className="row g-2 align-items-center">
                <div className="col-12 col-sm-4">
                  <div className="d-flex align-items-center justify-content-between gap-1">
                    <label className="small text-muted mb-0 fw-semibold" style={{ fontSize: '0.75rem' }}>Qty:</label>
                    <div className="input-group input-group-sm" style={{ width: '130px' }}>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm px-2 fw-bold"
                        disabled={item.quantity <= 1}
                        onClick={() => handleItemChange(idx, 'quantity', Math.max(1, Number(item.quantity || 1) - 1))}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        className="form-control form-control-sm font-mono text-center fw-bold px-1"
                        value={item.quantity}
                        min="1"
                        onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, Number(e.target.value) || 1))}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm px-2 fw-bold"
                        onClick={() => handleItemChange(idx, 'quantity', Number(item.quantity || 0) + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-6 col-sm-4">
                  <label className="form-label small mb-1" style={{ fontSize: '0.75rem' }}>Batch / Lot #</label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-mono"
                    placeholder="Batch #"
                    value={item.batchNumber}
                    onChange={(e) => handleItemChange(idx, 'batchNumber', e.target.value)}
                  />
                </div>
                <div className="col-6 col-sm-4">
                  <label className="form-label small mb-1" style={{ fontSize: '0.75rem' }}>Expiry Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={item.expiryDate}
                    onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
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

        {/* Bottom Section: Summary Card */}
        <div className="row justify-content-end">
          <div className="col-12 col-md-6">
            <div className="card p-3 p-sm-4 bg-light border rounded shadow-sm" style={{ overflow: 'hidden' }}>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Total Quantity Received:</span>
                <span className="fw-bold font-mono text-dark fs-6">{totalUnits} Units</span>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Stock Action:</span>
                <span className="badge bg-success">✓ Add Directly to Warehouse Stock</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary-zenith py-2 mt-3 w-100 justify-content-center fw-bold fs-6 shadow-sm"
                disabled={loading}
              >
                {loading ? 'Receiving Goods...' : 'Confirm Receipt & Inward Stock'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
