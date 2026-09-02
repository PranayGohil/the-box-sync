import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/DataTable';
import { InvoiceModal } from '../../components/InvoiceModal';
import { ExportButtons } from '../../components/ExportButtons';

export const Invoices = () => {
  const { activeBusiness } = useAuth();
  const { addToast } = useToast();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
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
    setCategoryFilter('');
    setStatusFilter('');
    setPaymentFilter('');
    setDatePreset('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = Boolean(search || categoryFilter || statusFilter || paymentFilter || datePreset || startDate || endDate);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let url = `/sales/invoices?search=${encodeURIComponent(search)}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (paymentFilter) url += `&paymentStatus=${paymentFilter}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await api.get(url);
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      console.error('[Invoices Error]:', err);
      addToast('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search, categoryFilter, statusFilter, paymentFilter, startDate, endDate]);

  const handleCancelInvoice = async (invoiceId) => {
    const reason = prompt('Please enter cancellation reason:');
    if (!reason) return;

    try {
      const res = await api.post(`/sales/invoices/${invoiceId}/cancel`, { reason });
      if (res.data.success) {
        addToast('Invoice cancelled and accounting/stock reversed', 'success');
        fetchInvoices();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to cancel invoice', 'error');
    }
  };

  const handleShareWhatsApp = (inv) => {
    const text = `Invoice from ${activeBusiness?.name || 'Us'}\nInvoice No: ${inv.invoiceNo}\nAmount Due: ₹${inv.balanceAmount || inv.grandTotal}\nThank you!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Top Metrics Calculation
  const totalInvoiced = invoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  const totalTax = invoices.reduce((sum, i) => sum + (i.totalTax || 0), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
  const totalReceivables = invoices.reduce((sum, i) => sum + (i.balanceAmount || 0), 0);

  const columns = [
    {
      header: 'Invoice #',
      accessor: 'invoiceNo',
      render: (row) => (
        <div>
          <span className="fw-bold font-mono text-primary">#{row.invoiceNo}</span>
          <div className="small text-muted">{new Date(row.invoiceDate).toLocaleDateString('en-IN')}</div>
        </div>
      )
    },
    {
      header: 'Customer',
      accessor: 'customerNameSnapshot',
      render: (row) => {
        const isB2B = row.invoiceCategory === 'B2B' || Boolean(row.customerGSTINSnapshot);
        return (
          <div>
            <div className="d-flex align-items-center gap-1">
              <span
                className={`badge ${isB2B ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-light text-secondary border'}`}
                style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}
              >
                {row.invoiceCategory || (isB2B ? 'B2B' : 'B2C')}
              </span>
              <span className="fw-bold text-dark">{row.customerNameSnapshot}</span>
            </div>
            {row.customerGSTINSnapshot && (
              <div className="text-muted font-mono mt-1" style={{ fontSize: '0.68rem' }}>
                GSTIN: {row.customerGSTINSnapshot}
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: 'Taxable (₹)',
      accessor: 'taxableAmount',
      align: 'right',
      render: (row) => <span className="font-mono">₹{fmt(row.taxableAmount)}</span>
    },
    {
      header: 'Tax (₹)',
      accessor: 'totalTax',
      align: 'right',
      render: (row) => <span className="font-mono text-muted">₹{fmt(row.totalTax)}</span>
    },
    {
      header: 'Grand Total (₹)',
      accessor: 'grandTotal',
      align: 'right',
      render: (row) => <span className="fw-bold font-mono text-dark">₹{fmt(row.grandTotal)}</span>
    },
    {
      header: 'Payment Status',
      accessor: 'paymentStatus',
      align: 'center',
      render: (row) => {
        const isPaid = row.paymentStatus === 'paid';
        const isPartial = row.paymentStatus === 'partially_paid';
        return (
          <span className={`badge-status ${isPaid ? 'badge-paid' : isPartial ? 'badge-partial' : 'badge-unpaid'}`}>
            {row.paymentStatus?.toUpperCase()}
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (row) => {
        let badgeClass = 'badge-finalized';
        let label = row.status?.toUpperCase();

        if (row.status === 'cancelled') {
          badgeClass = 'badge-cancelled';
        } else if (row.status === 'returned') {
          badgeClass = 'badge-returned';
          label = 'RETURNED';
        } else if (row.status === 'partially_returned') {
          badgeClass = 'badge-partial-return';
          label = 'PARTIAL RETURN';
        }

        return (
          <div className="d-flex flex-column align-items-center">
            <span className={`badge-status ${badgeClass}`}>
              {label}
            </span>
            {row.returnedAmount > 0 && (
              <span className="text-danger font-mono mt-1" style={{ fontSize: '0.65rem' }}>
                Ret: ₹{fmt(row.returnedAmount)}
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="d-flex justify-content-end gap-1">
          <button
            className="btn btn-sm btn-outline-primary py-1 px-2"
            title="Preview & Print"
            onClick={() => {
              setSelectedInvoice(row);
              setShowPreviewModal(true);
            }}
          >
            <i className="bi bi-printer"></i>
          </button>
          {row.status !== 'cancelled' && (
            <NavLink
              to={`/sales/invoices/${row._id}/edit`}
              className="btn btn-sm btn-outline-primary py-1 px-2"
              title="Edit Invoice / Record Payment"
            >
              <i className="bi bi-pencil"></i>
            </NavLink>
          )}
          <button
            className="btn btn-sm btn-outline-secondary py-1 px-2"
            title="Share WhatsApp"
            onClick={() => handleShareWhatsApp(row)}
          >
            <i className="bi bi-whatsapp text-success"></i>
          </button>
          {row.status !== 'cancelled' && (
            <button
              className="btn btn-sm btn-outline-danger py-1 px-2"
              title="Cancel Invoice"
              onClick={() => handleCancelInvoice(row._id)}
            >
              <i className="bi bi-x-circle"></i>
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="invoices-page-container">
      {/* 1. Header with Responsive Action Buttons */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            GST Sales Tax Invoices
          </h4>
          <p className="text-muted small mb-0">
            Manage customer billing, GST compliance, PDF generation, and receipts
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end align-items-center flex-wrap">
          <ExportButtons
            filename="GST_Invoices"
            title="GST Sales Invoices Register"
            subtitle={`${activeBusiness?.name || 'Business'} | Invoices Report`}
            headers={['Invoice #', 'Date', 'Customer', 'GSTIN', 'Category', 'Taxable Amt (Rs)', 'GST Tax (Rs)', 'Grand Total (Rs)', 'Paid (Rs)', 'Balance (Rs)', 'Status']}
            data={invoices.map((inv) => [
              inv.invoiceNo,
              new Date(inv.invoiceDate).toLocaleDateString('en-IN'),
              inv.customerNameSnapshot || inv.customerId?.name || 'Walk-in',
              inv.customerGSTINSnapshot || inv.customerId?.gstin || '-',
              (inv.customerGSTINSnapshot || inv.customerId?.gstin) ? 'B2B' : 'B2C',
              inv.taxableAmount || 0,
              inv.totalTax || 0,
              inv.grandTotal || 0,
              inv.paidAmount || 0,
              inv.balanceAmount || 0,
              inv.status?.toUpperCase()
            ])}
          />
          <NavLink to="/pos" className="btn btn-outline-zenith btn-sm flex-fill flex-sm-grow-0 text-nowrap text-center">
            <i className="bi bi-lightning-charge-fill text-warning me-1"></i> POS Billing
          </NavLink>
          <NavLink to="/sales/invoices/new" className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0 text-nowrap text-center">
            <i className="bi bi-plus-lg me-1"></i> Create Invoice
          </NavLink>
        </div>
      </div>

      {/* 2. Top Metric Tiles Strip (Responsive 4-Card Overview) */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <i className="bi bi-receipt"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL INVOICED</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalInvoiced)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <i className="bi bi-cash-coin"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>COLLECTIONS PAID</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalPaid)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
              <i className="bi bi-clock-history"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>OUTSTANDING DUE</div>
              <div className="fw-bold font-mono text-truncate text-danger" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalReceivables)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <i className="bi bi-calculator"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>GST TAX TOTAL</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalTax)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="card-zenith p-3 mb-3">
        <div className="row g-2">
          {/* Search Box */}
          <div className="col-12 col-md-4">
            <div className="position-relative">
              <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '10px' }}></i>
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Search invoice #, customer, GSTIN..."
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

          {/* B2B / B2C Category Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm fw-semibold"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              title="Filter by GST Category (B2B / B2C)"
            >
              <option value="">All Categories (B2B/B2C)</option>
              <option value="B2B">B2B (Business / GSTIN)</option>
              <option value="B2C">B2C (Retail / Consumer)</option>
              <option value="SEZ">SEZ / Zero-Rated</option>
              <option value="DEEMED">Deemed Export</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm fw-semibold"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          {/* Document Status Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm fw-semibold"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Document Statuses</option>
              <option value="finalized">Finalized</option>
              <option value="partially_returned">Partially Returned</option>
              <option value="returned">Returned</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date Preset Filter */}
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
        </div>

        {/* Active Filter Chips & Actions Row */}
        {hasActiveFilters && (
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2 pt-2 border-top">
            <div className="d-flex flex-wrap align-items-center gap-1">
              <span className="small text-muted me-1">Active filters:</span>
              {categoryFilter && (
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle d-inline-flex align-items-center gap-1">
                  Category: {categoryFilter}
                  <i className="bi bi-x cursor-pointer" onClick={() => setCategoryFilter('')}></i>
                </span>
              )}
              {paymentFilter && (
                <span className="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
                  Payment: {paymentFilter}
                  <i className="bi bi-x cursor-pointer" onClick={() => setPaymentFilter('')}></i>
                </span>
              )}
              {statusFilter && (
                <span className="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
                  Status: {statusFilter}
                  <i className="bi bi-x cursor-pointer" onClick={() => setStatusFilter('')}></i>
                </span>
              )}
              {datePreset && (
                <span className="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
                  Period: {datePreset.replace('_', ' ')}
                  <i className="bi bi-x cursor-pointer" onClick={() => handleDatePresetChange('')}></i>
                </span>
              )}
            </div>

            <div className="d-flex align-items-center gap-2 ms-auto">
              <button
                type="button"
                className="btn btn-link btn-sm text-danger p-0 text-decoration-none small fw-semibold"
                onClick={handleClearFilters}
              >
                <i className="bi bi-x-circle me-1"></i> Clear All
              </button>
              <button
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 py-0 px-2"
                style={{ fontSize: '0.78rem', height: '26px' }}
                onClick={fetchInvoices}
                title="Refresh Invoices"
              >
                <i className="bi bi-arrow-clockwise"></i> Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Desktop & Tablet View (DataTable, hidden on mobile <768px) */}
      <div className="card-zenith d-none d-md-block">
        <DataTable
          columns={columns}
          data={invoices}
          loading={loading}
          emptyMessage="No GST invoices found"
          emptyIcon="bi-receipt"
        />
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="card-zenith p-4 text-center text-muted">
            <i className="bi bi-receipt fs-1 d-block mb-2 text-secondary opacity-50"></i>
            <div className="fw-bold">No Invoices Found</div>
            <div className="small">Try adjusting search or status filters.</div>
          </div>
        ) : (
          invoices.map((inv) => {
            const isPaid = inv.paymentStatus === 'paid';
            const isPartial = inv.paymentStatus === 'partially_paid';

            return (
              <div key={inv._id} className="invoice-card-mobile">
                {/* Header Line */}
                <div className="invoice-card-mobile-header">
                  <div
                    className="d-flex align-items-center gap-1 cursor-pointer"
                    onClick={() => {
                      setSelectedInvoice(inv);
                      setShowPreviewModal(true);
                    }}
                    title="Tap to preview invoice"
                  >
                    <span className="fw-bold font-mono text-primary fs-6 text-decoration-underline">
                      #{inv.invoiceNo}
                    </span>
                    <span className="text-muted ms-1" style={{ fontSize: '0.75rem' }}>
                      {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div className="fw-extrabold font-mono fs-6 text-dark">
                    ₹{fmt(inv.grandTotal)}
                  </div>
                </div>

                {/* Customer Details */}
                <div className="mb-2">
                  <div className="d-flex align-items-center gap-1">
                    <span
                      className={`badge ${inv.invoiceCategory === 'B2B' || inv.customerGSTINSnapshot ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-light text-secondary border'}`}
                      style={{ fontSize: '0.62rem', padding: '0.15rem 0.35rem' }}
                    >
                      {inv.invoiceCategory || (inv.customerGSTINSnapshot ? 'B2B' : 'B2C')}
                    </span>
                    <span className="fw-bold text-dark small text-truncate">{inv.customerNameSnapshot || 'Retail Customer'}</span>
                  </div>
                  {inv.customerGSTINSnapshot && (
                    <div className="text-muted font-mono mt-0.5" style={{ fontSize: '0.68rem' }}>
                      GSTIN: {inv.customerGSTINSnapshot}
                    </div>
                  )}
                </div>

                {/* Tax Breakdown Strip */}
                <div className="d-flex justify-content-between text-muted small font-mono py-1 px-2 mb-2 bg-light rounded border" style={{ fontSize: '0.72rem' }}>
                  <span>Taxable: <strong className="text-dark">₹{fmt(inv.taxableAmount || 0)}</strong></span>
                  <span>GST: <strong className="text-primary">+₹{fmt(inv.totalTax || 0)}</strong></span>
                </div>

                {/* Financial Status & Badges */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="small text-muted font-mono" style={{ fontSize: '0.75rem' }}>
                    Paid: <span className="text-success fw-bold">₹{fmt(inv.paidAmount)}</span>
                    {inv.balanceAmount > 0 && (
                      <span className="ms-2">
                        Due: <span className="text-danger fw-bold">₹{fmt(inv.balanceAmount)}</span>
                      </span>
                    )}
                  </div>
                  <div className="d-flex gap-1 flex-wrap justify-content-end">
                    <span
                      className={`badge-status ${
                        isPaid ? 'badge-paid' : isPartial ? 'badge-partial' : 'badge-unpaid'
                      }`}
                      style={{ fontSize: '0.68rem', padding: '0.2rem 0.45rem' }}
                    >
                      {inv.paymentStatus?.toUpperCase()}
                    </span>
                    <span
                      className={`badge-status ${
                        inv.status === 'cancelled'
                          ? 'badge-cancelled'
                          : inv.status === 'returned'
                          ? 'badge-returned'
                          : inv.status === 'partially_returned'
                          ? 'badge-partial-return'
                          : 'badge-finalized'
                      }`}
                      style={{ fontSize: '0.68rem', padding: '0.2rem 0.45rem' }}
                    >
                      {inv.status === 'partially_returned' ? 'PARTIAL RETURN' : inv.status?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="invoice-card-mobile-actions">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm flex-fill py-1 d-flex align-items-center justify-content-center gap-1"
                    style={{ fontSize: '0.78rem' }}
                    onClick={() => {
                      setSelectedInvoice(inv);
                      setShowPreviewModal(true);
                    }}
                  >
                    <i className="bi bi-printer"></i> View / Print
                  </button>

                  {inv.status !== 'cancelled' && (
                    <NavLink
                      to={`/sales/invoices/${inv._id}/edit`}
                      className="btn btn-outline-primary btn-sm flex-fill py-1 d-flex align-items-center justify-content-center gap-1"
                      style={{ fontSize: '0.78rem' }}
                    >
                      <i className="bi bi-pencil"></i> Edit / Pay
                    </NavLink>
                  )}

                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm py-1 px-2"
                    title="Share WhatsApp"
                    onClick={() => handleShareWhatsApp(inv)}
                  >
                    <i className="bi bi-whatsapp text-success"></i>
                  </button>

                  {inv.status !== 'cancelled' && (
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm py-1 px-2"
                      title="Cancel Invoice"
                      onClick={() => handleCancelInvoice(inv._id)}
                    >
                      <i className="bi bi-x-circle"></i>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Invoice Preview & PDF Modal */}
      {showPreviewModal && selectedInvoice && (
        <InvoiceModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          invoice={selectedInvoice}
          business={activeBusiness}
        />
      )}
    </div>
  );
};
