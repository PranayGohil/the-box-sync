import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/DataTable';
import { DocumentModal } from '../../components/DocumentModal';
import { ExportButtons } from '../../components/ExportButtons';

export const PurchaseBills = () => {
  const { activeBusiness } = useAuth();
  const { addToast } = useToast();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
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
    setPaymentFilter('');
    setStatusFilter('');
    setDatePreset('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = Boolean(search || paymentFilter || statusFilter || datePreset || startDate || endDate);

  const fetchBills = async () => {
    setLoading(true);
    try {
      let url = `/purchases/bills?search=${encodeURIComponent(search)}`;
      if (paymentFilter) url += `&paymentStatus=${paymentFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await api.get(url);
      if (res.data.success) setBills(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load purchase bills', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [search, paymentFilter, statusFilter, startDate, endDate]);

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Top Metrics Calculation
  const totalPurchases = bills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
  const totalITC = bills.reduce((sum, b) => sum + (b.totalTax || 0), 0);
  const totalPaid = bills.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const totalPayables = bills.reduce((sum, b) => sum + (b.balanceAmount || 0), 0);

  const columns = [
    {
      header: 'Bill #',
      accessor: 'billNo',
      render: (row) => (
        <div>
          <span className="fw-bold font-mono text-primary">#{row.billNo}</span>
          <div className="small text-muted">{new Date(row.billDate).toLocaleDateString('en-IN')}</div>
        </div>
      )
    },
    {
      header: 'Supplier',
      accessor: 'supplierNameSnapshot',
      render: (row) => (
        <div>
          <div className="fw-bold text-dark">{row.supplierNameSnapshot}</div>
          {row.supplierGSTINSnapshot && (
            <span className="badge bg-light text-muted border font-mono" style={{ fontSize: '0.68rem' }}>
              GSTIN: {row.supplierGSTINSnapshot}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Vendor Ref #',
      accessor: 'supplierInvoiceNo',
      render: (row) => <span className="font-mono text-dark fw-semibold">{row.supplierInvoiceNo || '-'}</span>
    },
    {
      header: 'Taxable (₹)',
      accessor: 'taxableAmount',
      align: 'right',
      render: (row) => <span className="font-mono">₹{fmt(row.taxableAmount)}</span>
    },
    {
      header: 'GST ITC (₹)',
      accessor: 'totalTax',
      align: 'right',
      render: (row) => <span className="font-mono text-primary">₹{fmt(row.totalTax)}</span>
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
          <span
            className={`badge-status ${
              isPaid ? 'badge-paid' : isPartial ? 'badge-partial' : 'badge-unpaid'
            }`}
          >
            {row.paymentStatus?.toUpperCase()}
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (row) => (
        <span
          className={`badge-status ${
            row.status === 'finalized' ? 'badge-finalized' : 'badge-cancelled'
          }`}
        >
          {row.status?.toUpperCase()}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="d-flex justify-content-end gap-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary py-1 px-2 d-flex align-items-center gap-1"
            title="View & Print Purchase Bill"
            onClick={() => {
              setSelectedBill(row);
              setShowPreviewModal(true);
            }}
          >
            <i className="bi bi-eye"></i> View
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="purchase-bills-page-container">
      {/* 1. Header with Responsive Action Button */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Purchase Bills & Inward Stock
          </h4>
          <p className="text-muted small mb-0">
            Record supplier vendor invoices, claim Input Tax Credit (ITC), and replenish inventory
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end align-items-center flex-wrap">
          <ExportButtons
            filename="Purchase_Bills"
            title="Inward Purchase Bills Register"
            subtitle={`${activeBusiness?.name || 'Business'} | Purchase Bills`}
            headers={['Bill #', 'Date', 'Supplier', 'GSTIN', 'Taxable Amt (Rs)', 'ITC GST (Rs)', 'Grand Total (Rs)', 'Paid (Rs)', 'Balance (Rs)', 'Payment Status']}
            data={bills.map((b) => [
              b.billNo,
              new Date(b.billDate).toLocaleDateString('en-IN'),
              b.supplierNameSnapshot || b.supplierId?.name || 'Vendor',
              b.supplierGSTINSnapshot || b.supplierId?.gstin || '-',
              b.taxableAmount || 0,
              b.totalTax || 0,
              b.grandTotal || 0,
              b.paidAmount || 0,
              b.balanceAmount || 0,
              b.paymentStatus?.toUpperCase()
            ])}
          />
          <NavLink
            to="/purchases/bills/new"
            className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0 text-nowrap text-center"
          >
            <i className="bi bi-plus-lg me-1"></i> Record Purchase Bill
          </NavLink>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <i className="bi bi-receipt-cutoff"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL PURCHASES</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalPurchases)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <i className="bi bi-shield-check"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>INPUT TAX CREDIT (ITC)</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalITC)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <i className="bi bi-cash-stack"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>OUTWARD PAID</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalPaid)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
              <i className="bi bi-hourglass-bottom"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>ACCOUNTS PAYABLE</div>
              <div className="fw-bold font-mono text-truncate text-danger" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalPayables)}
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
                placeholder="Search by bill #, supplier, vendor ref #..."
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
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm fw-semibold"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Document Statuses</option>
              <option value="finalized">Finalized</option>
              <option value="cancelled">Cancelled</option>
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

          <div className="col-6 col-md-1">
            <button
              className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
              onClick={fetchBills}
              title="Refresh Bills"
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
          data={bills}
          loading={loading}
          emptyMessage="No purchase bills recorded"
          emptyIcon="bi-receipt-cutoff"
        />
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : bills.length === 0 ? (
          <div className="card-zenith p-4 text-center text-muted">
            <i className="bi bi-receipt-cutoff fs-1 d-block mb-2 text-secondary opacity-50"></i>
            <div className="fw-bold">No Purchase Bills Found</div>
            <div className="small">Click "Record Purchase Bill" to add your first supplier bill.</div>
          </div>
        ) : (
          bills.map((bill) => {
            const isPaid = bill.paymentStatus === 'paid';
            const isPartial = bill.paymentStatus === 'partially_paid';

            return (
              <div key={bill._id} className="invoice-card-mobile">
                {/* Header */}
                <div className="invoice-card-mobile-header">
                  <div
                    className="cursor-pointer d-flex align-items-center gap-1"
                    onClick={() => {
                      setSelectedBill(bill);
                      setShowPreviewModal(true);
                    }}
                    title="Click to view purchase bill"
                  >
                    <i className="bi bi-receipt text-primary"></i>
                    <span className="fw-bold font-mono text-primary fs-6">#{bill.billNo}</span>
                    <span className="text-muted ms-1" style={{ fontSize: '0.72rem' }}>
                      {new Date(bill.billDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div className="fw-extrabold font-mono text-dark" style={{ fontSize: '1.05rem' }}>
                    ₹{fmt(bill.grandTotal)}
                  </div>
                </div>

                {/* Supplier & Vendor Ref */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="fw-bold text-dark small text-truncate" style={{ maxWidth: '190px' }}>
                    {bill.supplierNameSnapshot}
                  </div>
                  {bill.supplierInvoiceNo && (
                    <span className="small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                      Ref: #{bill.supplierInvoiceNo}
                    </span>
                  )}
                </div>

                {/* Tax & ITC Strip */}
                <div className="d-flex justify-content-between text-muted font-mono py-1 px-2 mb-2 bg-light rounded border" style={{ fontSize: '0.72rem' }}>
                  <span>Taxable: <strong className="text-dark">₹{fmt(bill.taxableAmount || 0)}</strong></span>
                  <span>ITC GST: <strong className="text-primary">+₹{fmt(bill.totalTax || 0)}</strong></span>
                </div>

                {/* Balances & Status */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="small text-muted font-mono" style={{ fontSize: '0.75rem' }}>
                    Paid: <span className="text-success fw-bold">₹{fmt(bill.paidAmount)}</span>
                    {bill.balanceAmount > 0 && (
                      <span className="ms-2">
                        Due: <span className="text-danger fw-bold">₹{fmt(bill.balanceAmount)}</span>
                      </span>
                    )}
                  </div>
                  <span
                    className={`badge-status ${
                      isPaid ? 'badge-paid' : isPartial ? 'badge-partial' : 'badge-unpaid'
                    }`}
                    style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
                  >
                    {bill.paymentStatus?.toUpperCase()}
                  </span>
                </div>

                {/* View Action */}
                <div className="d-flex justify-content-end pt-2 border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm py-1 px-3 fw-bold d-flex align-items-center gap-1"
                    style={{ fontSize: '0.78rem' }}
                    onClick={() => {
                      setSelectedBill(bill);
                      setShowPreviewModal(true);
                    }}
                  >
                    <i className="bi bi-eye"></i> View Bill
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Document View & Print Modal */}
      <DocumentModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        document={selectedBill}
        business={activeBusiness}
        docType="purchase_bill"
      />
    </div>
  );
};
