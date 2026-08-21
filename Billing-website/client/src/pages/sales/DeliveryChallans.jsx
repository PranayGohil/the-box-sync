import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/DataTable';

export const DeliveryChallans = () => {
  const { addToast } = useToast();
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [policyFilter, setPolicyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales/challans');
      if (res.data.success) setChallans(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load delivery challans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, []);

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Filtered Challans
  const filteredChallans = challans.filter((c) => {
    const matchesSearch =
      !search ||
      c.challanNo?.toLowerCase().includes(search.toLowerCase()) ||
      c.customerNameSnapshot?.toLowerCase().includes(search.toLowerCase()) ||
      c.vehicleNo?.toLowerCase().includes(search.toLowerCase());
    const matchesPolicy = !policyFilter || c.stockPolicyApplied === policyFilter;
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesPolicy && matchesStatus;
  });

  // Top Metrics Calculation
  const totalChallansCount = challans.length;
  const totalQuantityUnits = challans.reduce(
    (sum, c) => sum + (c.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0),
    0
  );
  const deductPolicyCount = challans.filter((c) => c.stockPolicyApplied === 'DEDUCT').length;
  const reservePolicyCount = challans.filter((c) => c.stockPolicyApplied === 'RESERVE').length;

  const columns = [
    {
      header: 'Challan #',
      accessor: 'challanNo',
      render: (row) => (
        <div>
          <span className="fw-bold font-mono text-primary">#{row.challanNo}</span>
          <div className="small text-muted">{new Date(row.date).toLocaleDateString('en-IN')}</div>
        </div>
      )
    },
    {
      header: 'Customer',
      accessor: 'customerNameSnapshot',
      render: (row) => <div className="fw-bold text-dark">{row.customerNameSnapshot}</div>
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
      header: 'Vehicle / Transporter',
      accessor: 'vehicleNo',
      render: (row) => (
        <div className="small">
          <div className="font-mono fw-bold text-dark">{row.vehicleNo || 'Self / Courier'}</div>
          {row.transporterName && <div className="text-muted" style={{ fontSize: '0.72rem' }}>{row.transporterName}</div>}
        </div>
      )
    },
    {
      header: 'Stock Policy',
      accessor: 'stockPolicyApplied',
      align: 'center',
      render: (row) => {
        const isDeduct = row.stockPolicyApplied === 'DEDUCT';
        const isReserve = row.stockPolicyApplied === 'RESERVE';
        return (
          <span
            className={`badge ${
              isDeduct
                ? 'bg-success-subtle text-success border border-success-subtle'
                : isReserve
                ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                : 'bg-light text-muted border'
            }`}
          >
            {row.stockPolicyApplied}
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (row) => (
        <span className="badge-status badge-finalized">
          {row.status?.toUpperCase() || 'DISPATCHED'}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="d-flex justify-content-end gap-1">
          <NavLink
            to="/sales/invoices/new"
            className="btn btn-sm btn-outline-primary py-1 px-2 d-flex align-items-center gap-1"
            title="Generate GST Invoice"
          >
            <i className="bi bi-receipt"></i> Create Invoice
          </NavLink>
        </div>
      )
    }
  ];

  return (
    <div className="delivery-challans-page-container">
      {/* 1. Header with Responsive Action Button */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Delivery Challans & Dispatch Tracking
          </h4>
          <p className="text-muted small mb-0">
            Issue goods dispatch documents, manage vehicle logistics, and sync inventory stock ledgers
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end">
          <NavLink
            to="/sales/challans/new"
            className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0"
          >
            <i className="bi bi-plus-lg"></i> Create Delivery Challan
          </NavLink>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <i className="bi bi-truck"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL DISPATCHED</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {totalChallansCount} Challans
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
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL QUANTITY</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                {totalQuantityUnits} Units
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <i className="bi bi-box-arrow-right"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>STOCK DEDUCTED</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                {deductPolicyCount} Dispatches
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
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>STOCK RESERVED</div>
              <div className="fw-bold font-mono text-truncate text-warning" style={{ fontSize: '0.95rem' }}>
                {reservePolicyCount} Orders
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
                placeholder="Search by challan #, customer, vehicle #..."
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
              value={policyFilter}
              onChange={(e) => setPolicyFilter(e.target.value)}
            >
              <option value="">All Stock Policies</option>
              <option value="DEDUCT">DEDUCT (Immediate)</option>
              <option value="RESERVE">RESERVE (Hold Stock)</option>
              <option value="NONE">NONE (No Impact)</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm fw-semibold"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Challan Statuses</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
              <option value="invoiced">Invoiced</option>
            </select>
          </div>

          <div className="col-12 col-md-1">
            <button
              className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
              onClick={fetchChallans}
              title="Refresh Challans"
            >
              <i className="bi bi-arrow-clockwise"></i> <span className="d-md-none">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Desktop & Tablet View (DataTable, hidden on mobile <768px) */}
      <div className="card-zenith d-none d-md-block">
        <DataTable
          columns={columns}
          data={filteredChallans}
          loading={loading}
          emptyMessage="No delivery challans found"
          emptyIcon="bi-truck"
        />
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : filteredChallans.length === 0 ? (
          <div className="card-zenith p-4 text-center text-muted">
            <i className="bi bi-truck fs-1 d-block mb-2 text-secondary opacity-50"></i>
            <div className="fw-bold">No Delivery Challans Found</div>
            <div className="small">Click "Create Delivery Challan" to dispatch your first shipment.</div>
          </div>
        ) : (
          filteredChallans.map((ch) => {
            const isDeduct = ch.stockPolicyApplied === 'DEDUCT';
            const isReserve = ch.stockPolicyApplied === 'RESERVE';

            return (
              <div key={ch._id} className="invoice-card-mobile">
                {/* Header Line */}
                <div className="invoice-card-mobile-header">
                  <div>
                    <span className="fw-bold font-mono text-primary fs-6">#{ch.challanNo}</span>
                    <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
                      {new Date(ch.date).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <span
                    className={`badge ${
                      isDeduct
                        ? 'bg-success-subtle text-success border border-success-subtle'
                        : isReserve
                        ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                        : 'bg-light text-muted border'
                    }`}
                    style={{ fontSize: '0.68rem' }}
                  >
                    {ch.stockPolicyApplied}
                  </span>
                </div>

                {/* Customer Details */}
                <div className="mb-2">
                  <div className="fw-bold text-dark small">{ch.customerNameSnapshot}</div>
                  <div className="d-flex align-items-center gap-2 mt-1 small text-muted">
                    <span>
                      <i className="bi bi-building me-1"></i>
                      {ch.warehouseId?.name || 'Main Warehouse'}
                    </span>
                    {ch.vehicleNo && (
                      <span className="font-mono text-dark fw-bold">
                        <i className="bi bi-truck me-1"></i>
                        {ch.vehicleNo}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status & Action */}
                <div className="invoice-card-mobile-actions">
                  <NavLink
                    to="/sales/invoices/new"
                    className="btn btn-outline-primary btn-sm flex-fill py-1 d-flex align-items-center justify-content-center gap-1"
                    style={{ fontSize: '0.78rem' }}
                  >
                    <i className="bi bi-receipt"></i> Generate GST Invoice
                  </NavLink>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
