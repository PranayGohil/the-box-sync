import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const StockTransfers = () => {
  const { addToast } = useToast();
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1 }]);
  const [transporterVehicle, setTransporterVehicle] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sumRes, prodRes, whRes] = await Promise.allSettled([
          api.get('/inventory/summary'),
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

        if ((!whList || whList.length === 0) && sumRes.status === 'fulfilled' && sumRes.value?.data?.success) {
          const whMap = {};
          sumRes.value.data.data.forEach((b) => {
            if (b.warehouseId) whMap[b.warehouseId._id] = b.warehouseId;
          });
          whList = Object.values(whMap);
        }

        if (!whList || whList.length === 0) {
          whList = [
            { _id: 'main', name: 'Main Warehouse', isDefault: true },
            { _id: 'secondary', name: 'Retail Outlet / Branch Store' }
          ];
        }

        setWarehouses(whList);
        if (whList.length >= 2) {
          setFromWarehouseId(whList[0]._id);
          setToWarehouseId(whList[1]._id);
        } else if (whList.length === 1) {
          setFromWarehouseId(whList[0]._id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadData();
  }, []);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const totalTransferUnits = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!fromWarehouseId || !toWarehouseId) {
      addToast('Please select both source and destination warehouses', 'warning');
      return;
    }

    if (fromWarehouseId === toWarehouseId) {
      addToast('Source and destination warehouse cannot be the same', 'warning');
      return;
    }

    const validItems = items.filter((i) => i.productId && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      addToast('Please select at least one product with quantity > 0', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/inventory/transfers', {
        fromWarehouseId: fromWarehouseId !== 'main' ? fromWarehouseId : undefined,
        toWarehouseId: toWarehouseId !== 'secondary' ? toWarehouseId : undefined,
        items: validItems.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity)
        })),
        transporterDetails: { vehicleNo: transporterVehicle },
        notes
      });

      if (res.data.success) {
        addToast('Stock transferred successfully between warehouses!', 'success');
        setItems([{ productId: '', quantity: 1 }]);
        setNotes('');
        setTransporterVehicle('');
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to transfer stock', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stock-transfers-page-container">
      {/* 1. Header with Responsive Action Buttons */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Inter-Warehouse Stock Transfer
          </h4>
          <p className="text-muted small mb-0">
            Relocate inventory between branches, stores, and regional distribution warehouses
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
              <i className="bi bi-building"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>AVAILABLE WAREHOUSES</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {warehouses.length} Locations
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <i className="bi bi-box-seam"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TRANSFERABLE ITEMS</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                {products.length} Products
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <i className="bi bi-truck"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>LOGISTICS TRACKING</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                Manifest Active
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
              <i className="bi bi-arrow-left-right"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TRANSFER LOGIC</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                Atomic 2-Way Sync
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Transfer Form */}
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10 col-xl-9">
          <div className="card-zenith p-3 p-sm-4">
            <h5 className="fw-bold mb-3 pb-2 border-bottom text-dark">
              <i className="bi bi-arrow-left-right text-primary me-2"></i>
              Execute Warehouse Transfer Manifest
            </h5>

            <form onSubmit={handleTransfer}>
              {/* Warehouses From/To */}
              <div className="row g-3 mb-4 align-items-center">
                <div className="col-12 col-md-5">
                  <label className="form-label fw-bold">Source Warehouse (FROM)*</label>
                  <select
                    className="form-select fw-semibold"
                    value={fromWarehouseId}
                    onChange={(e) => setFromWarehouseId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Source --</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id} disabled={w._id === toWarehouseId}>
                        {w.name} {w.isDefault ? '(Primary)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-2 text-center d-none d-md-block pt-3">
                  <div className="badge bg-primary rounded-circle p-2 fs-6">
                    <i className="bi bi-arrow-right"></i>
                  </div>
                </div>

                <div className="col-12 col-md-5">
                  <label className="form-label fw-bold">Destination Warehouse (TO)*</label>
                  <select
                    className="form-select fw-semibold"
                    value={toWarehouseId}
                    onChange={(e) => setToWarehouseId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Destination --</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id} disabled={w._id === fromWarehouseId}>
                        {w.name} {w.isDefault ? '(Primary)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Transfer Line Items */}
              <h6 className="fw-bold small mb-2 text-dark">Products & Quantities to Transfer:</h6>
              <div className="table-responsive mb-3 border rounded">
                <table className="table table-bordered align-middle mb-0">
                  <thead className="bg-light">
                    <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ width: '65%' }}>Product to Transfer</th>
                      <th style={{ width: '25%' }} className="text-center">Transfer Qty</th>
                      <th style={{ width: '10%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const selectedP = products.find((p) => p._id === item.productId);

                      return (
                        <tr key={idx}>
                          <td>
                            <select
                              className="form-select form-select-sm fw-bold"
                              value={item.productId}
                              onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                              required
                            >
                              <option value="">-- Select Product --</option>
                              {products.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.name} (Available: {p.currentStock} {p.unitId?.symbol || 'PCS'})
                                </option>
                              ))}
                            </select>
                            {selectedP && (
                              <div className="small text-muted font-mono mt-1" style={{ fontSize: '0.72rem' }}>
                                SKU: {selectedP.sku || '-'} | Unit: {selectedP.unitId?.symbol || 'PCS'}
                              </div>
                            )}
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm font-mono text-center fw-bold"
                              placeholder="Qty"
                              value={item.quantity}
                              min="1"
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                              required
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
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button type="button" className="btn btn-outline-primary btn-sm mb-4" onClick={addItemRow}>
                <i className="bi bi-plus-circle me-1"></i> Add Another Product
              </button>

              {/* Logistics & Manifest Details */}
              <div className="row g-3 mb-4 p-3 bg-light border rounded">
                <div className="col-12 col-sm-6">
                  <label className="form-label small fw-bold">Transporter / Vehicle Number</label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-mono text-uppercase"
                    placeholder="e.g. MH 12 AB 1234"
                    value={transporterVehicle}
                    onChange={(e) => setTransporterVehicle(e.target.value)}
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label small fw-bold">Transfer Remarks & Gate Pass</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Inter-branch stock replenishment"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-3 mb-4 rounded border bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted fw-semibold">Total Quantity to Relocate:</span>
                  <span className="fw-bold font-mono text-primary fs-5">{totalTransferUnits} Units</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary-zenith py-2 w-100 justify-content-center fw-bold fs-6 shadow-sm"
                disabled={submitting}
              >
                {submitting ? 'Executing Transfer...' : 'Initiate & Complete Stock Transfer'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
