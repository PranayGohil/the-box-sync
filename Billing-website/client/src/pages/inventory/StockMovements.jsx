import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../api/client';
import { DataTable } from '../../components/DataTable';

export const StockMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [movementFilter, setMovementFilter] = useState('');
  const [voucherFilter, setVoucherFilter] = useState('');

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/movements');
      if (res.data.success) setMovements(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  // Filtered movements
  const filteredMovements = movements.filter((m) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !search ||
      m.productId?.name?.toLowerCase().includes(term) ||
      m.productId?.sku?.toLowerCase().includes(term) ||
      m.voucherNo?.toLowerCase().includes(term) ||
      m.voucherType?.toLowerCase().includes(term);
    const matchesMovement = !movementFilter || m.movementType === movementFilter;
    const matchesVoucher = !voucherFilter || m.voucherType === voucherFilter;
    return matchesSearch && matchesMovement && matchesVoucher;
  });

  // Top Metrics Calculation
  const totalTransactionsCount = movements.length;
  const totalInwardUnits = movements
    .filter((m) => m.movementType === 'IN')
    .reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
  const totalOutwardUnits = movements
    .filter((m) => m.movementType === 'OUT')
    .reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
  const netVariance = totalInwardUnits - totalOutwardUnits;

  const columns = [
    {
      header: 'Date & Time',
      accessor: 'date',
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{new Date(row.date).toLocaleDateString('en-IN')}</div>
          <div className="small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
            {new Date(row.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )
    },
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
      header: 'Voucher Ref',
      accessor: 'voucherNo',
      render: (row) => (
        <div>
          <span className="font-mono fw-bold text-primary">#{row.voucherNo}</span>
          <div className="small text-muted text-uppercase" style={{ fontSize: '0.72rem' }}>
            {row.voucherType?.replace(/_/g, ' ')}
          </div>
        </div>
      )
    },
    {
      header: 'Warehouse',
      accessor: 'warehouseId',
      render: (row) => (
        <span className="badge bg-light text-dark border">
          <i className="bi bi-building me-1 text-muted"></i>
          {row.warehouseId?.name || 'Main Warehouse'}
        </span>
      )
    },
    {
      header: 'Movement',
      accessor: 'movementType',
      align: 'center',
      render: (row) => {
        const isIn = row.movementType === 'IN';
        return (
          <span
            className={`badge ${
              isIn
                ? 'bg-success-subtle text-success border border-success-subtle'
                : 'bg-danger-subtle text-danger border border-danger-subtle'
            } fw-bold`}
          >
            {isIn ? '+ INWARD' : '- OUTWARD'}
          </span>
        );
      }
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      align: 'center',
      render: (row) => (
        <span className={`fw-bold font-mono fs-6 ${row.movementType === 'IN' ? 'text-success' : 'text-danger'}`}>
          {row.movementType === 'IN' ? '+' : '-'}{row.quantity}
        </span>
      )
    },
    {
      header: 'Balance Stock After',
      accessor: 'balanceStockAfter',
      align: 'center',
      render: (row) => (
        <span className="badge bg-light text-dark border font-mono fw-bold">
          {row.balanceStockAfter ?? '-'}
        </span>
      )
    }
  ];

  return (
    <div className="stock-movements-page-container">
      {/* 1. Header with Responsive Action Buttons */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Stock Movement Ledger
          </h4>
          <p className="text-muted small mb-0">
            Immutable audit log of all inventory inward receipts, sales dispatches, transfers, and adjustments
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
              <i className="bi bi-arrow-left-right"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL TRANSACTIONS</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {totalTransactionsCount} Logs
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <i className="bi bi-box-arrow-in-down"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>INWARD STOCK RECEIVED</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                +{totalInwardUnits} Units
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
              <i className="bi bi-box-arrow-up-right"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>OUTWARD DISPATCHED</div>
              <div className="fw-bold font-mono text-truncate text-danger" style={{ fontSize: '0.95rem' }}>
                -{totalOutwardUnits} Units
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <i className="bi bi-calculator"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>NET STOCK VARIANCE</div>
              <div className={`fw-bold font-mono text-truncate ${netVariance >= 0 ? 'text-primary' : 'text-danger'}`} style={{ fontSize: '0.95rem' }}>
                {netVariance >= 0 ? `+${netVariance}` : netVariance} Units
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="card-zenith p-3 mb-3">
        <div className="row g-2">
          <div className="col-12 col-md-5">
            <div className="position-relative">
              <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '10px' }}></i>
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Search by product, SKU, voucher #..."
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

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm fw-semibold"
              value={movementFilter}
              onChange={(e) => setMovementFilter(e.target.value)}
            >
              <option value="">All Movement Types</option>
              <option value="IN">+ INWARD Only</option>
              <option value="OUT">- OUTWARD Only</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm fw-semibold"
              value={voucherFilter}
              onChange={(e) => setVoucherFilter(e.target.value)}
            >
              <option value="">All Voucher Types</option>
              <option value="invoice">GST Sales Invoice</option>
              <option value="pos_invoice">POS Fast Billing</option>
              <option value="purchase_bill">Purchase Bill</option>
              <option value="delivery_challan">Delivery Challan</option>
              <option value="grn">Goods Receipt Note (GRN)</option>
              <option value="sales_return">Sales Return</option>
              <option value="purchase_return">Purchase Return</option>
              <option value="adjustment_in">Stock Adjustment IN</option>
              <option value="adjustment_out">Stock Adjustment OUT</option>
              <option value="transfer_in">Stock Transfer IN</option>
              <option value="transfer_out">Stock Transfer OUT</option>
            </select>
          </div>

          <div className="col-12 col-md-1">
            <button
              className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center"
              onClick={fetchMovements}
              title="Refresh Ledger"
            >
              <i className="bi bi-arrow-clockwise"></i> <span className="d-md-none ms-1">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Desktop & Tablet View (DataTable, hidden on mobile <768px) */}
      <div className="card-zenith d-none d-md-block">
        <DataTable
          columns={columns}
          data={filteredMovements}
          loading={loading}
          emptyMessage="No stock movements recorded"
          emptyIcon="bi-arrow-left-right"
        />
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="card-zenith p-4 text-center text-muted">
            <i className="bi bi-arrow-left-right fs-1 d-block mb-2 text-secondary opacity-50"></i>
            <div className="fw-bold">No Movement Entries Found</div>
            <div className="small">Inward items or bill products to generate ledger movement logs.</div>
          </div>
        ) : (
          filteredMovements.map((mov, idx) => {
            const isIn = mov.movementType === 'IN';

            return (
              <div key={idx} className="invoice-card-mobile">
                {/* Header */}
                <div className="invoice-card-mobile-header">
                  <div>
                    <span className="font-mono fw-bold text-primary fs-6">#{mov.voucherNo}</span>
                    <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
                      {new Date(mov.date).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div className={`fw-extrabold font-mono fs-6 ${isIn ? 'text-success' : 'text-danger'}`}>
                    {isIn ? '+' : '-'}{mov.quantity} Units
                  </div>
                </div>

                {/* Product & Warehouse */}
                <div className="mb-2">
                  <div className="fw-bold text-dark small">{mov.productId?.name}</div>
                  <div className="d-flex align-items-center gap-2 mt-1 small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                    <span>SKU: {mov.productId?.sku || '-'}</span>
                    <span>• {mov.warehouseId?.name || 'Main Warehouse'}</span>
                  </div>
                </div>

                {/* Footer: Voucher Type & Running Balance */}
                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                  <span className="badge bg-light text-muted border text-uppercase" style={{ fontSize: '0.68rem' }}>
                    {mov.voucherType?.replace(/_/g, ' ')}
                  </span>
                  <div className="small text-muted font-mono" style={{ fontSize: '0.75rem' }}>
                    Balance After: <span className="fw-bold text-dark">{mov.balanceStockAfter ?? '-'}</span>
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
