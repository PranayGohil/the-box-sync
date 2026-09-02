import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/DataTable';
import { DocumentModal } from '../../components/DocumentModal';
import { ExportButtons } from '../../components/ExportButtons';

export const SalesOrders = () => {
  const { activeBusiness } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reservedFilter, setReservedFilter] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleDatePresetChange = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === 'today') {
      const today = now.toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'this_fy') {
      const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      setStartDate(`${startYear}-04-01`);
      setEndDate(`${startYear + 1}-03-31`);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setReservedFilter('');
    setDatePreset('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = Boolean(search || statusFilter || reservedFilter || datePreset || startDate || endDate);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales/orders');
      if (res.data.success) setOrders(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load sales orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    const reason = prompt('Please enter cancellation reason:');
    if (!reason) return;

    try {
      const res = await api.post(`/sales/orders/${orderId}/cancel`, { reason });
      if (res.data.success) {
        addToast('Sales order cancelled and reserved stock released', 'success');
        fetchOrders();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to cancel order', 'error');
    }
  };

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.orderNo?.toLowerCase().includes(search.toLowerCase()) ||
      o.customerNameSnapshot?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || o.status === statusFilter;
    const matchesReserved =
      !reservedFilter ||
      (reservedFilter === 'yes' && o.isStockReserved) ||
      (reservedFilter === 'no' && !o.isStockReserved);
    let matchesDate = true;
    if (startDate && endDate) {
      const oDate = new Date(o.date || o.createdAt).toISOString().split('T')[0];
      matchesDate = oDate >= startDate && oDate <= endDate;
    }
    return matchesSearch && matchesStatus && matchesReserved && matchesDate;
  });

  // Top Metrics Calculation
  const totalOrdersCount = orders.length;
  const totalBookedValue = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const confirmedOrders = orders.filter((o) => o.status === 'confirmed');
  const confirmedValue = confirmedOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const reservedOrders = orders.filter((o) => o.isStockReserved && o.status === 'confirmed');
  const reservedValue = reservedOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const columns = [
    {
      header: 'Order #',
      accessor: 'orderNo',
      render: (row) => (
        <div>
          <span className="fw-bold font-mono text-primary">#{row.orderNo}</span>
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
      header: 'Grand Total (₹)',
      accessor: 'grandTotal',
      align: 'right',
      render: (row) => <span className="fw-bold font-mono text-dark">₹{fmt(row.grandTotal)}</span>
    },
    {
      header: 'Stock Status',
      accessor: 'isStockReserved',
      align: 'center',
      render: (row) => (
        <span
          className={`badge ${
            row.isStockReserved
              ? 'bg-info-subtle text-info-emphasis border border-info-subtle'
              : 'bg-light text-muted border'
          }`}
          style={{ fontSize: '0.72rem' }}
        >
          {row.isStockReserved ? '📦 Stock Reserved' : 'Unreserved'}
        </span>
      )
    },
    {
      header: 'Order Status',
      accessor: 'status',
      align: 'center',
      render: (row) => {
        const isConfirmed = row.status === 'confirmed';
        const isCancelled = row.status === 'cancelled';
        return (
          <span
            className={`badge-status ${
              isConfirmed ? 'badge-finalized' : isCancelled ? 'badge-cancelled' : 'badge-paid'
            }`}
          >
            {row.status?.toUpperCase() || 'CONFIRMED'}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="d-flex justify-content-end gap-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary py-1 px-2 d-flex align-items-center gap-1"
            title="View & Print Sales Order"
            onClick={() => {
              setSelectedOrder(row);
              setShowPreviewModal(true);
            }}
          >
            <i className="bi bi-eye"></i> View
          </button>
          {row.status !== 'cancelled' && row.status !== 'completed' && (
            <NavLink
              to={`/sales/orders/${row._id}/edit`}
              className="btn btn-sm btn-outline-primary py-1 px-2 d-flex align-items-center gap-1"
              title="Edit Sales Order"
            >
              <i className="bi bi-pencil"></i> Edit
            </NavLink>
          )}
          {row.status !== 'cancelled' && (
            <NavLink
              to={`/sales/invoices/new?salesOrderId=${row._id}`}
              className="btn btn-sm btn-outline-success py-1 px-2 d-flex align-items-center gap-1"
              title="Generate Invoice from Order"
            >
              <i className="bi bi-receipt"></i> Create Invoice
            </NavLink>
          )}
          {row.status !== 'cancelled' && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger py-1 px-2"
              title="Cancel Order"
              onClick={() => handleCancelOrder(row._id)}
            >
              <i className="bi bi-x-circle"></i>
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="sales-orders-page-container">
      {/* 1. Header with Responsive Action Button */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Sales Orders & Fulfillment
          </h4>
          <p className="text-muted small mb-0">
            Track confirmed sales orders, manage warehouse stock reservations, and dispatch fulfillment
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end align-items-center flex-wrap">
          <ExportButtons
            filename="Sales_Orders"
            title="Customer Sales Orders Register"
            subtitle={`${activeBusiness?.name || 'Business'} | Sales Orders`}
            headers={['Order #', 'Date', 'Delivery Date', 'Customer', 'Taxable Amt (Rs)', 'GST Tax (Rs)', 'Grand Total (Rs)', 'Stock Reserved', 'Status']}
            data={filteredOrders.map((o) => [
              o.orderNo,
              new Date(o.date).toLocaleDateString('en-IN'),
              o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString('en-IN') : '-',
              o.customerNameSnapshot || o.customerId?.name || 'Walk-in',
              o.taxableAmount || 0,
              o.totalTax || 0,
              o.grandTotal || 0,
              o.isStockReserved ? 'YES' : 'NO',
              o.status?.toUpperCase()
            ])}
          />
          <NavLink
            to="/sales/orders/new"
            className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0 text-nowrap text-center"
          >
            <i className="bi bi-plus-lg me-1"></i> Create Sales Order
          </NavLink>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <i className="bi bi-cart-check"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL BOOKED ORDERS</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalBookedValue)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <i className="bi bi-hourglass-split"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>ACTIVE CONFIRMED</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(confirmedValue)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <i className="bi bi-box-seam"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>RESERVED STOCK VALUE</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(reservedValue)}
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
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL ORDERS</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {totalOrdersCount} Orders
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="card-zenith p-3 mb-3">
        <div className="row g-2">
          <div className="col-12 col-md-4">
            <div className="position-relative">
              <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '10px' }}></i>
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Search by order #, customer..."
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

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm fw-semibold"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Order Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="invoiced">Invoiced / Fulfilled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm fw-semibold"
              value={reservedFilter}
              onChange={(e) => setReservedFilter(e.target.value)}
            >
              <option value="">All Stock Types</option>
              <option value="yes">Stock Reserved Only</option>
              <option value="no">Unreserved</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm fw-semibold"
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              title="Filter by Date Period"
            >
              <option value="">All Periods</option>
              <option value="today">Today</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_fy">This Financial Year</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <button
              className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
              onClick={fetchOrders}
              title="Refresh Orders"
            >
              <i className="bi bi-arrow-clockwise"></i> <span className="d-md-none">Refresh</span>
            </button>
          </div>
        </div>

        {/* Active Filter Chips & Actions Row */}
        {hasActiveFilters && (
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2 pt-2 border-top">
            <div className="d-flex flex-wrap align-items-center gap-1">
              <span className="small text-muted me-1">Active filters:</span>
              {statusFilter && (
                <span className="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
                  Status: {statusFilter}
                  <i className="bi bi-x cursor-pointer" onClick={() => setStatusFilter('')}></i>
                </span>
              )}
              {reservedFilter && (
                <span className="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
                  Stock: {reservedFilter === 'yes' ? 'Reserved' : 'Unreserved'}
                  <i className="bi bi-x cursor-pointer" onClick={() => setReservedFilter('')}></i>
                </span>
              )}
              {datePreset && (
                <span className="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
                  Period: {datePreset.replace('_', ' ')}
                  <i className="bi bi-x cursor-pointer" onClick={() => handleDatePresetChange('')}></i>
                </span>
              )}
            </div>

            <button
              type="button"
              className="btn btn-link btn-sm text-danger p-0 text-decoration-none small fw-semibold ms-auto"
              onClick={handleClearFilters}
            >
              <i className="bi bi-x-circle me-1"></i> Clear All
            </button>
          </div>
        )}
      </div>

      {/* 4. Desktop & Tablet View (DataTable, hidden on mobile <768px) */}
      <div className="card-zenith d-none d-md-block">
        <DataTable
          columns={columns}
          data={filteredOrders}
          loading={loading}
          emptyMessage="No sales orders found"
          emptyIcon="bi-cart-check"
        />
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="card-zenith p-4 text-center text-muted">
            <i className="bi bi-cart-x fs-1 d-block mb-2 text-secondary opacity-50"></i>
            <div className="fw-bold">No Sales Orders Found</div>
            <div className="small">Click "Create Sales Order" to book your first confirmed order.</div>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const isConfirmed = ord.status === 'confirmed';
            const isCancelled = ord.status === 'cancelled';

            return (
              <div key={ord._id} className="invoice-card-mobile">
                {/* Header Line */}
                <div className="invoice-card-mobile-header">
                  <div
                    className="cursor-pointer d-flex align-items-center gap-1"
                    onClick={() => {
                      setSelectedOrder(ord);
                      setShowPreviewModal(true);
                    }}
                    title="Click to preview sales order"
                  >
                    <i className="bi bi-cart-check text-primary"></i>
                    <span className="fw-bold font-mono text-primary fs-6">#{ord.orderNo}</span>
                    <span className="text-muted ms-1" style={{ fontSize: '0.72rem' }}>
                      {new Date(ord.date).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div className="fw-extrabold font-mono text-dark" style={{ fontSize: '1.05rem' }}>
                    ₹{fmt(ord.grandTotal)}
                  </div>
                </div>

                {/* Customer Details */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="fw-bold text-dark small text-truncate" style={{ maxWidth: '190px' }}>
                    {ord.customerNameSnapshot}
                  </div>
                  <div className="small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                    Delivery: {ord.deliveryDate ? new Date(ord.deliveryDate).toLocaleDateString('en-IN') : 'Standard'}
                  </div>
                </div>

                {/* Tax Itemization Strip */}
                <div className="d-flex justify-content-between text-muted font-mono py-1 px-2 mb-2 bg-light rounded border" style={{ fontSize: '0.72rem' }}>
                  <span>Taxable: <strong className="text-dark">₹{fmt(ord.taxableAmount || 0)}</strong></span>
                  <span>GST: <strong className="text-primary">+₹{fmt(ord.totalTax || 0)}</strong></span>
                </div>

                {/* Status Badges Row */}
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span
                    className={`badge ${
                      ord.isStockReserved
                        ? 'bg-info-subtle text-info-emphasis border border-info-subtle'
                        : 'bg-light text-muted border'
                    }`}
                    style={{ fontSize: '0.68rem' }}
                  >
                    {ord.isStockReserved ? '📦 Stock Reserved' : 'Unreserved'}
                  </span>
                  <span
                    className={`badge-status ${
                      isConfirmed ? 'badge-finalized' : isCancelled ? 'badge-cancelled' : 'badge-paid'
                    }`}
                    style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
                  >
                    {ord.status?.toUpperCase() || 'CONFIRMED'}
                  </span>
                </div>

                {/* Mobile Actions */}
                {ord.status !== 'cancelled' && (
                  <div className="d-flex gap-1 flex-wrap pt-2 border-top">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm py-1 px-2 fw-bold d-flex align-items-center gap-1"
                      style={{ fontSize: '0.78rem' }}
                      onClick={() => {
                        setSelectedOrder(ord);
                        setShowPreviewModal(true);
                      }}
                    >
                      <i className="bi bi-eye"></i> View
                    </button>
                    {ord.status !== 'completed' && (
                      <NavLink
                        to={`/sales/orders/${ord._id}/edit`}
                        className="btn btn-outline-primary btn-sm py-1 px-2 fw-bold d-flex align-items-center gap-1"
                        style={{ fontSize: '0.78rem' }}
                      >
                        <i className="bi bi-pencil"></i> Edit
                      </NavLink>
                    )}
                    <NavLink
                      to={`/sales/invoices/new?salesOrderId=${ord._id}`}
                      className="btn btn-outline-success btn-sm flex-fill py-1 d-flex align-items-center justify-content-center gap-1 fw-bold"
                      style={{ fontSize: '0.78rem' }}
                    >
                      <i className="bi bi-receipt"></i> Create Invoice
                    </NavLink>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm py-1 px-2"
                      title="Cancel Order"
                      onClick={() => handleCancelOrder(ord._id)}
                    >
                      <i className="bi bi-x-circle"></i>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Document View & Print Modal */}
      <DocumentModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        document={selectedOrder}
        business={activeBusiness}
        docType="sales_order"
      />
    </div>
  );
};
