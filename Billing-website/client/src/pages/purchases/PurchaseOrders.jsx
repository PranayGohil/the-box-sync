import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/DataTable';

export const PurchaseOrders = () => {
  const { addToast } = useToast();
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchases/orders');
      if (res.data.success) setPos(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load purchase orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  const handleConvertToGRN = async (poId) => {
    const challan = prompt('Enter Vendor Delivery Challan / Invoice No:');
    if (!challan) return;

    try {
      const res = await api.post(`/purchases/orders/${poId}/convert-grn`, {
        deliveryChallanNo: challan
      });
      if (res.data.success) {
        addToast('GRN generated and stock received into warehouse!', 'success');
        fetchPOs();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to convert PO to GRN', 'error');
    }
  };

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Filtered POs
  const filteredPOs = pos.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !search ||
      p.poNo?.toLowerCase().includes(term) ||
      p.supplierNameSnapshot?.toLowerCase().includes(term) ||
      p.warehouseId?.name?.toLowerCase().includes(term);
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Top Metrics Calculation
  const totalPOCount = pos.length;
  const totalPOValue = pos.reduce((sum, p) => sum + (p.grandTotal || 0), 0);
  const receivedPOs = pos.filter((p) => p.status === 'received');
  const receivedValue = receivedPOs.reduce((sum, p) => sum + (p.grandTotal || 0), 0);
  const pendingPOs = pos.filter((p) => p.status !== 'received');
  const pendingValue = pendingPOs.reduce((sum, p) => sum + (p.grandTotal || 0), 0);

  const columns = [
    {
      header: 'PO #',
      accessor: 'poNo',
      render: (row) => (
        <div>
          <span className="fw-bold font-mono text-primary">#{row.poNo}</span>
          <div className="small text-muted">{new Date(row.date).toLocaleDateString('en-IN')}</div>
        </div>
      )
    },
    {
      header: 'Supplier',
      accessor: 'supplierNameSnapshot',
      render: (row) => <div className="fw-bold text-dark">{row.supplierNameSnapshot}</div>
    },
    {
      header: 'Receiving Warehouse',
      accessor: 'warehouseId',
      render: (row) => (
        <span className="badge bg-light text-dark border">
          <i className="bi bi-building me-1 text-muted"></i>
          {row.warehouseId?.name || 'Main Warehouse'}
        </span>
      )
    },
    {
      header: 'Grand Total (₹)',
      accessor: 'grandTotal',
      align: 'right',
      render: (row) => <span className="fw-bold font-mono text-dark">₹{fmt(row.grandTotal)}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (row) => {
        const isReceived = row.status === 'received';
        return (
          <span className={`badge-status ${isReceived ? 'badge-paid' : 'badge-finalized'}`}>
            {isReceived ? 'RECEIVED (GRN)' : row.status?.toUpperCase() || 'ISSUED'}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div>
          {row.status !== 'received' ? (
            <button
              className="btn btn-sm btn-outline-success py-1 px-2 d-flex align-items-center gap-1"
              onClick={() => handleConvertToGRN(row._id)}
              title="Receive Physical Goods into Warehouse (GRN)"
            >
              <i className="bi bi-box-arrow-in-down"></i> Receive GRN
            </button>
          ) : (
            <span className="badge bg-light text-success border">
              <i className="bi bi-check2-circle me-1"></i> Stock Received
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="purchase-orders-page-container">
      {/* 1. Header with Responsive Action Button */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Purchase Orders (PO)
          </h4>
          <p className="text-muted small mb-0">
            Procure inventory from suppliers, track deliveries, and accept goods into warehouse via GRN
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end">
          <NavLink
            to="/purchases/orders/new"
            className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0"
          >
            <i className="bi bi-plus-lg"></i> Create Purchase Order
          </NavLink>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <i className="bi bi-cart-plus"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>COMMITTED PROCUREMENT</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalPOValue)}
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
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>ACTIVE PENDING</div>
              <div className="fw-bold font-mono text-truncate text-warning" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(pendingValue)}
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
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>RECEIVED VIA GRN</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(receivedValue)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
              <i className="bi bi-list-check"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL POS</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {totalPOCount} Orders
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="card-zenith p-3 mb-3">
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <div className="position-relative">
              <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '10px' }}></i>
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Search by PO #, supplier, warehouse..."
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

          <div className="col-8 col-md-5">
            <select
              className="form-select form-select-sm fw-semibold"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All PO Statuses</option>
              <option value="issued">Issued / Pending</option>
              <option value="received">Received / GRN</option>
            </select>
          </div>

          <div className="col-4 col-md-1">
            <button
              className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center"
              onClick={fetchPOs}
              title="Refresh POs"
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
          data={filteredPOs}
          loading={loading}
          emptyMessage="No purchase orders created"
          emptyIcon="bi-file-earmark-plus"
        />
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : filteredPOs.length === 0 ? (
          <div className="card-zenith p-4 text-center text-muted">
            <i className="bi bi-file-earmark-plus fs-1 d-block mb-2 text-secondary opacity-50"></i>
            <div className="fw-bold">No Purchase Orders Found</div>
            <div className="small">Click "Create Purchase Order" to issue your first vendor order.</div>
          </div>
        ) : (
          filteredPOs.map((po) => {
            const isReceived = po.status === 'received';

            return (
              <div key={po._id} className="invoice-card-mobile">
                {/* Header */}
                <div className="invoice-card-mobile-header">
                  <div>
                    <span className="fw-bold font-mono text-primary fs-6">#{po.poNo}</span>
                    <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
                      {new Date(po.date).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div className="fw-extrabold font-mono fs-6 text-dark">
                    ₹{fmt(po.grandTotal)}
                  </div>
                </div>

                {/* Supplier & Warehouse */}
                <div className="mb-2">
                  <div className="fw-bold text-dark small">{po.supplierNameSnapshot}</div>
                  <div className="small text-muted mt-1">
                    <i className="bi bi-building me-1"></i>
                    {po.warehouseId?.name || 'Main Warehouse'}
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                  <span
                    className={`badge-status ${
                      isReceived ? 'badge-paid' : 'badge-finalized'
                    }`}
                    style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
                  >
                    {isReceived ? 'RECEIVED' : 'ISSUED'}
                  </span>

                  {po.status !== 'received' ? (
                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm py-1 px-3 fw-bold d-flex align-items-center gap-1"
                      style={{ fontSize: '0.78rem' }}
                      onClick={() => handleConvertToGRN(po._id)}
                    >
                      <i className="bi bi-box-arrow-in-down"></i> Receive GRN
                    </button>
                  ) : (
                    <span className="text-success small fw-bold">
                      <i className="bi bi-check2-circle me-1"></i> Stock Inward Done
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
