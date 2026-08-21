import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../api/client';
import { DataTable } from '../../components/DataTable';

export const StockSummary = () => {
  const [balances, setBalances] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const [res, whRes] = await Promise.allSettled([
        api.get('/inventory/summary'),
        api.get('/businesses/profile')
      ]);

      if (res.status === 'fulfilled' && res.value?.data?.success) {
        setBalances(res.value.data.data);
      }

      if (whRes.status === 'fulfilled' && whRes.value?.data?.data?.warehouses) {
        setWarehouses(whRes.value.data.data.warehouses);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Filtered Balances
  const filteredBalances = balances.filter((b) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !search ||
      b.productId?.name?.toLowerCase().includes(term) ||
      b.productId?.sku?.toLowerCase().includes(term) ||
      b.warehouseId?.name?.toLowerCase().includes(term);
    const matchesWarehouse = !warehouseFilter || b.warehouseId?._id === warehouseFilter;
    return matchesSearch && matchesWarehouse;
  });

  // Top Metrics Calculation
  const totalValuation = balances.reduce(
    (sum, b) => sum + ((b.quantity || 0) * (b.averageCost || b.productId?.purchasePrice || 0)),
    0
  );
  const totalPhysicalUnits = balances.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
  const totalAvailableUnits = balances.reduce((sum, b) => sum + (Number(b.availableQuantity) || 0), 0);
  const totalReservedUnits = balances.reduce((sum, b) => sum + (Number(b.reservedQuantity) || 0), 0);

  const columns = [
    {
      header: 'Product',
      accessor: 'productId',
      render: (row) => (
        <div>
          <div className="fw-bold text-dark">{row.productId?.name}</div>
          <div className="small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
            SKU: {row.productId?.sku || '-'}
          </div>
        </div>
      )
    },
    {
      header: 'Warehouse',
      accessor: 'warehouseId',
      render: (row) => (
        <div>
          <span className="badge bg-light text-dark border">
            <i className="bi bi-building me-1 text-muted"></i>
            {row.warehouseId?.name || 'Main Warehouse'}
          </span>
        </div>
      )
    },
    {
      header: 'Avg Cost (₹)',
      accessor: 'averageCost',
      align: 'right',
      render: (row) => (
        <span className="font-mono">
          ₹{fmt(row.averageCost || row.productId?.purchasePrice || 0)}
        </span>
      )
    },
    {
      header: 'Physical Stock',
      accessor: 'quantity',
      align: 'center',
      render: (row) => <span className="fw-bold font-mono text-dark">{row.quantity || 0}</span>
    },
    {
      header: 'Reserved Stock',
      accessor: 'reservedQuantity',
      align: 'center',
      render: (row) => (
        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle font-mono">
          {row.reservedQuantity || 0}
        </span>
      )
    },
    {
      header: 'Available for Sale',
      accessor: 'availableQuantity',
      align: 'center',
      render: (row) => (
        <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold font-mono">
          {row.availableQuantity || 0}
        </span>
      )
    },
    {
      header: 'Stock Valuation (₹)',
      align: 'right',
      render: (row) => (
        <span className="fw-bold font-mono text-primary">
          ₹{fmt((row.quantity || 0) * (row.averageCost || row.productId?.purchasePrice || 0))}
        </span>
      )
    }
  ];

  return (
    <div className="stock-summary-page-container">
      {/* 1. Header with Responsive Action Buttons */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Warehouse Stock Summary
          </h4>
          <p className="text-muted small mb-0">
            Multi-warehouse physical stock balances, reserved quantities, and live inventory valuation
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end">
          <NavLink to="/inventory/transfers" className="btn btn-outline-zenith btn-sm flex-fill flex-sm-grow-0">
            <i className="bi bi-arrow-left-right"></i> Transfer Stock
          </NavLink>
          <NavLink to="/inventory/adjustments" className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0">
            <i className="bi bi-sliders"></i> Adjust Stock
          </NavLink>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <i className="bi bi-cash-stack"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL VALUATION</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalValuation)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <i className="bi bi-boxes"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>PHYSICAL STOCK</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                {totalPhysicalUnits} Units
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <i className="bi bi-cart-check"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>AVAILABLE TO SELL</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                {totalAvailableUnits} Units
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <i className="bi bi-hourglass-split"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>RESERVED ORDERS</div>
              <div className="fw-bold font-mono text-truncate text-warning" style={{ fontSize: '0.95rem' }}>
                {totalReservedUnits} Units
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="card-zenith p-3 mb-3">
        <div className="row g-2">
          <div className="col-12 col-md-7">
            <div className="position-relative">
              <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '10px' }}></i>
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Search by product name, SKU, warehouse..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="btn btn-sm btn-link text-muted position-absolute end-0 top-0 p-1"
                  onClick={() => setSearch('')}
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              )}
            </div>
          </div>

          <div className="col-10 col-md-4">
            <select
              className="form-select form-select-sm fw-semibold"
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="col-2 col-md-1">
            <button
              className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center"
              onClick={fetchSummary}
              title="Refresh Summary"
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Desktop & Tablet View (DataTable, hidden on mobile <768px) */}
      <div className="card-zenith d-none d-md-block">
        <DataTable
          columns={columns}
          data={filteredBalances}
          loading={loading}
          emptyMessage="No stock balances found in warehouses"
          emptyIcon="bi-boxes"
        />
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : filteredBalances.length === 0 ? (
          <div className="card-zenith p-4 text-center text-muted">
            <i className="bi bi-boxes fs-1 d-block mb-2 text-secondary opacity-50"></i>
            <div className="fw-bold">No Stock Balances Found</div>
            <div className="small">Inward items or add opening inventory to view balances.</div>
          </div>
        ) : (
          filteredBalances.map((bal, idx) => {
            const val = (bal.quantity || 0) * (bal.averageCost || bal.productId?.purchasePrice || 0);

            return (
              <div key={idx} className="invoice-card-mobile">
                {/* Header */}
                <div className="invoice-card-mobile-header">
                  <div className="fw-bold text-dark fs-6 text-truncate" style={{ maxWidth: '65%' }}>
                    {bal.productId?.name}
                  </div>
                  <div className="fw-extrabold font-mono fs-6 text-primary">
                    ₹{fmt(val)}
                  </div>
                </div>

                {/* SKU & Warehouse */}
                <div className="mb-2">
                  <div className="d-flex gap-2 small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                    <span>SKU: {bal.productId?.sku || '-'}</span>
                    <span>• {bal.warehouseId?.name || 'Main Warehouse'}</span>
                  </div>
                </div>

                {/* Stock Quantities Breakdown */}
                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                  <div className="small font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                    Total: <span className="fw-bold text-dark">{bal.quantity || 0}</span>
                  </div>
                  <div className="d-flex gap-1">
                    {bal.reservedQuantity > 0 && (
                      <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle" style={{ fontSize: '0.68rem' }}>
                        Reserved: {bal.reservedQuantity}
                      </span>
                    )}
                    <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold font-mono" style={{ fontSize: '0.68rem' }}>
                      Avail: {bal.availableQuantity || 0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
