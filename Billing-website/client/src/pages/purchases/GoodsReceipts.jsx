import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/DataTable';

export const GoodsReceipts = () => {
  const { addToast } = useToast();
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchGRNs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchases/grn');
      if (res.data.success) setGrns(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load goods receipt notes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGRNs();
  }, []);

  // Filtered GRNs
  const filteredGRNs = grns.filter((g) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      g.grnNo?.toLowerCase().includes(term) ||
      g.supplierId?.name?.toLowerCase().includes(term) ||
      g.deliveryChallanNo?.toLowerCase().includes(term) ||
      g.vehicleNo?.toLowerCase().includes(term)
    );
  });

  // Top Metrics Calculation
  const totalGRNsCount = grns.length;
  const totalQuantityUnits = grns.reduce(
    (sum, g) => sum + (g.items?.reduce((s, i) => s + (Number(i.quantity) || 0), 0) || 0),
    0
  );
  const uniqueSuppliersCount = new Set(grns.map((g) => g.supplierId?._id || g.supplierId)).size;
  const uniqueWarehousesCount = new Set(grns.map((g) => g.warehouseId?._id || g.warehouseId)).size;

  const columns = [
    {
      header: 'GRN #',
      accessor: 'grnNo',
      render: (row) => (
        <div>
          <span className="fw-bold font-mono text-primary">#{row.grnNo}</span>
          <div className="small text-muted">{new Date(row.date).toLocaleDateString('en-IN')}</div>
        </div>
      )
    },
    {
      header: 'Supplier',
      accessor: 'supplierId',
      render: (row) => (
        <div className="fw-bold text-dark">
          {row.supplierId?.name || row.supplierNameSnapshot || 'Vendor'}
        </div>
      )
    },
    {
      header: 'Vendor Challan / Ref',
      accessor: 'deliveryChallanNo',
      render: (row) => (
        <div className="small">
          <span className="font-mono fw-bold text-dark">{row.deliveryChallanNo || '-'}</span>
          {row.vehicleNo && <div className="text-muted" style={{ fontSize: '0.72rem' }}>Vehicle: {row.vehicleNo}</div>}
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
      header: 'Inward Status',
      accessor: 'status',
      align: 'center',
      render: (row) => (
        <span className="badge-status badge-paid">
          {row.status?.toUpperCase() || 'RECEIVED'}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="d-flex justify-content-end gap-1">
          <NavLink
            to="/purchases/bills/new"
            className="btn btn-sm btn-outline-primary py-1 px-2 d-flex align-items-center gap-1"
            title="Create Purchase Bill against Inward Goods"
          >
            <i className="bi bi-receipt"></i> Create Bill
          </NavLink>
        </div>
      )
    }
  ];

  return (
    <div className="goods-receipts-page-container">
      {/* 1. Header with Responsive Action Button */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Goods Receipt Notes (GRN)
          </h4>
          <p className="text-muted small mb-0">
            Audit physical gate inward entries, track vendor delivery challans, and restock warehouses
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end">
          <NavLink
            to="/purchases/grn/new"
            className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0"
          >
            <i className="bi bi-plus-lg"></i> Record Goods Receipt
          </NavLink>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <i className="bi bi-box-arrow-in-down"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL INWARD GRNS</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {totalGRNsCount} Receipts
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
              <i className="bi bi-truck"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>SUPPLIERS SERVICED</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                {uniqueSuppliersCount} Vendors
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
              <i className="bi bi-building"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>RECEIVING WAREHOUSES</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {uniqueWarehousesCount} Locations
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="card-zenith p-3 mb-3">
        <div className="row g-2">
          <div className="col-10 col-md-11">
            <div className="position-relative">
              <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '10px' }}></i>
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Search by GRN #, supplier name, vendor challan #, vehicle #..."
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

          <div className="col-2 col-md-1">
            <button
              className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center"
              onClick={fetchGRNs}
              title="Refresh GRNs"
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
          data={filteredGRNs}
          loading={loading}
          emptyMessage="No goods receipt notes recorded yet"
          emptyIcon="bi-box-arrow-in-down"
        />
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : filteredGRNs.length === 0 ? (
          <div className="card-zenith p-4 text-center text-muted">
            <i className="bi bi-box-arrow-in-down fs-1 d-block mb-2 text-secondary opacity-50"></i>
            <div className="fw-bold">No GRNs Found</div>
            <div className="small">Click "Record Goods Receipt" to log your first shipment.</div>
          </div>
        ) : (
          filteredGRNs.map((grn) => (
            <div key={grn._id} className="invoice-card-mobile">
              {/* Header */}
              <div className="invoice-card-mobile-header">
                <div>
                  <span className="fw-bold font-mono text-primary fs-6">#{grn.grnNo}</span>
                  <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
                    {new Date(grn.date).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <span className="badge-status badge-paid" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                  RECEIVED
                </span>
              </div>

              {/* Supplier & Warehouse */}
              <div className="mb-2">
                <div className="fw-bold text-dark small">
                  {grn.supplierId?.name || grn.supplierNameSnapshot || 'Vendor'}
                </div>
                <div className="d-flex align-items-center gap-2 mt-1 small text-muted">
                  <span>
                    <i className="bi bi-building me-1"></i>
                    {grn.warehouseId?.name || 'Main Warehouse'}
                  </span>
                  {grn.deliveryChallanNo && (
                    <span className="font-mono text-dark fw-bold">
                      Challan: #{grn.deliveryChallanNo}
                    </span>
                  )}
                </div>
              </div>

              {/* Mobile Action */}
              <div className="invoice-card-mobile-actions">
                <NavLink
                  to="/purchases/bills/new"
                  className="btn btn-outline-primary btn-sm flex-fill py-1 d-flex align-items-center justify-content-center gap-1"
                  style={{ fontSize: '0.78rem' }}
                >
                  <i className="bi bi-receipt"></i> Create Purchase Bill
                </NavLink>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
