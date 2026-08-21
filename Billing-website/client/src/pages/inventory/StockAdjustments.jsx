import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const StockAdjustments = () => {
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedProductObj, setSelectedProductObj] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState('increase');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('physical_count');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodRes, whRes] = await Promise.allSettled([
          api.get('/products?limit=200'),
          api.get('/businesses/profile')
        ]);

        if (prodRes.status === 'fulfilled' && prodRes.value?.data?.success) {
          setProducts(prodRes.value.data.data);
        }

        let whList = [];
        if (whRes.status === 'fulfilled' && whRes.value?.data?.data?.warehouses) {
          whList = whRes.value.data.data.warehouses;
        }
        if (!whList || whList.length === 0) {
          whList = [{ _id: 'main', name: 'Main Warehouse', isDefault: true }];
        }
        setWarehouses(whList);
        if (whList.length > 0) {
          setWarehouseId(whList[0]._id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadData();
  }, []);

  const handleProductChange = (e) => {
    const pId = e.target.value;
    setSelectedProduct(pId);
    const found = products.find((p) => p._id === pId);
    setSelectedProductObj(found || null);
  };

  const currentStock = Number(selectedProductObj?.currentStock) || 0;
  const adjustQty = Number(quantity) || 0;
  const projectedStock = adjustmentType === 'increase' ? currentStock + adjustQty : Math.max(0, currentStock - adjustQty);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !quantity || quantity <= 0) {
      addToast('Please select product and a valid quantity', 'warning');
      return;
    }

    if (!warehouseId) {
      addToast('Please select a warehouse', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const prod = selectedProductObj || products.find((p) => p._id === selectedProduct);
      const res = await api.post('/inventory/adjustments', {
        warehouseId: warehouseId !== 'main' ? warehouseId : undefined,
        items: [
          {
            productId: selectedProduct,
            type: adjustmentType,
            quantity: Number(quantity),
            unitCost: prod?.purchasePrice || 0,
            reason
          }
        ],
        notes
      });

      if (res.data.success) {
        addToast('Stock adjustment posted and stock ledger updated!', 'success');
        setQuantity(1);
        setNotes('');
        // Refresh products list
        const refresh = await api.get('/products?limit=200');
        if (refresh.data.success) {
          setProducts(refresh.data.data);
          const updated = refresh.data.data.find((p) => p._id === selectedProduct);
          setSelectedProductObj(updated || null);
        }
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to post adjustment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stock-adjustments-page-container">
      {/* 1. Header with Responsive Action Buttons */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Stock Adjustment & Physical Reconciliation
          </h4>
          <p className="text-muted small mb-0">
            Reconcile inventory count discrepancies, write off damaged/expired goods, or log found stock
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end">
          <NavLink to="/inventory/summary" className="btn btn-outline-zenith btn-sm flex-fill flex-sm-grow-0">
            <i className="bi bi-boxes"></i> Stock Summary
          </NavLink>
          <NavLink to="/inventory/movements" className="btn btn-outline-zenith btn-sm flex-fill flex-sm-grow-0">
            <i className="bi bi-arrow-left-right"></i> Movements Ledger
          </NavLink>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <i className="bi bi-box-seam"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL CATALOG ITEMS</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {products.length} Products
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <i className="bi bi-building"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>ACTIVE WAREHOUSES</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                {warehouses.length} Locations
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <i className="bi bi-sliders"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>AUDIT STATUS</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                Reconciliation Active
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <i className="bi bi-journal-check"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>LEDGER POSTING</div>
              <div className="fw-bold font-mono text-truncate text-warning" style={{ fontSize: '0.95rem' }}>
                Auto-Synchronized
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Adjustment Form Card */}
      <div className="row justify-content-center">
        <div className="col-12 col-lg-9 col-xl-8">
          <div className="card-zenith p-3 p-sm-4">
            <h5 className="fw-bold mb-3 pb-2 border-bottom text-dark">
              <i className="bi bi-sliders text-primary me-2"></i>
              Record Stock Adjustment Entry
            </h5>

            <form onSubmit={handleSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label">Select Warehouse*</label>
                  <select
                    className="form-select fw-semibold"
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    required
                  >
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name} {w.isDefault ? '(Primary)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Select Product to Adjust*</label>
                  <select
                    className="form-select fw-bold"
                    value={selectedProduct}
                    onChange={handleProductChange}
                    required
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} (In Stock: {p.currentStock} {p.unitId?.symbol || 'PCS'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Info & Live Stock Badge */}
              {selectedProductObj && (
                <div className="p-3 mb-3 bg-light border rounded">
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                    <div>
                      <div className="fw-bold text-dark">{selectedProductObj.name}</div>
                      <div className="small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                        SKU: {selectedProductObj.sku || '-'} | Unit: {selectedProductObj.unitId?.symbol || 'PCS'}
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-muted">Current Stock:</span>
                      <span className="badge bg-primary fs-6 font-mono">
                        {currentStock} {selectedProductObj.unitId?.symbol || 'PCS'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Adjustment Type & Quantity */}
              <div className="row g-3 mb-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label">Adjustment Type*</label>
                  <select
                    className="form-select fw-bold"
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value)}
                  >
                    <option value="increase">➕ Increase Stock (Found / Excess)</option>
                    <option value="decrease">➖ Decrease Stock (Damage / Loss / Expiry)</option>
                  </select>
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label">Quantity to Adjust*</label>
                  <input
                    type="number"
                    className="form-control font-mono fw-bold text-center"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Reason Selector */}
              <div className="mb-3">
                <label className="form-label">Adjustment Reason*</label>
                <select
                  className="form-select fw-semibold"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option value="physical_count">Physical Stock Count Reconciliation</option>
                  <option value="damage">Damaged in Transit / Storage</option>
                  <option value="expiry">Expired Stock Write-off</option>
                  <option value="theft">Pilferage / Discrepancy</option>
                  <option value="correction">Data Entry Error Correction</option>
                </select>
              </div>

              {/* Remarks */}
              <div className="mb-4">
                <label className="form-label">Remarks / Audit Inspection Notes</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Audit verification notes, physical stock count sheet reference..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>

              {/* Projected Stock Preview Card */}
              {selectedProductObj && (
                <div className="p-3 mb-4 rounded border" style={{ backgroundColor: adjustmentType === 'increase' ? '#ecfdf5' : '#fef2f2' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small fw-semibold text-muted">Projected New Stock Balance:</span>
                    <div className="d-flex align-items-center gap-2">
                      <span className="font-mono text-muted">{currentStock}</span>
                      <span>{adjustmentType === 'increase' ? '+' : '-'}</span>
                      <span className="font-mono fw-bold">{adjustQty}</span>
                      <span>=</span>
                      <span className={`fw-extrabold font-mono fs-5 ${adjustmentType === 'increase' ? 'text-success' : 'text-danger'}`}>
                        {projectedStock} {selectedProductObj.unitId?.symbol || 'PCS'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className={`btn w-100 py-2 justify-content-center fw-bold fs-6 shadow-sm ${
                  adjustmentType === 'increase' ? 'btn-success' : 'btn-danger'
                }`}
                disabled={submitting || !selectedProduct}
              >
                {submitting
                  ? 'Posting Adjustment...'
                  : adjustmentType === 'increase'
                  ? '➕ Apply Stock Increase'
                  : '➖ Apply Stock Reduction'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
