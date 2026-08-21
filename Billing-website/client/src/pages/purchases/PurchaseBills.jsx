import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/DataTable';

export const PurchaseBills = () => {
  const { addToast } = useToast();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchBills = async () => {
    setLoading(true);
    try {
      let url = `/purchases/bills?search=${encodeURIComponent(search)}`;
      if (paymentFilter) url += `&paymentStatus=${paymentFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;

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
  }, [search, paymentFilter, statusFilter]);

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
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end">
          <NavLink
            to="/purchases/bills/new"
            className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0"
          >
            <i className="bi bi-plus-lg"></i> Record Purchase Bill
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
          <div className="col-12 col-md-5">
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

          <div className="col-6 col-md-3">
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

          <div className="col-12 col-md-1">
            <button
              className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
              onClick={fetchBills}
              title="Refresh Bills"
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
                  <div>
                    <span className="fw-bold font-mono text-primary fs-6">#{bill.billNo}</span>
                    <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
                      {new Date(bill.billDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div className="fw-extrabold font-mono fs-6 text-dark">
                    ₹{fmt(bill.grandTotal)}
                  </div>
                </div>

                {/* Supplier & Vendor Ref */}
                <div className="mb-2">
                  <div className="fw-bold text-dark small">{bill.supplierNameSnapshot}</div>
                  {bill.supplierInvoiceNo && (
                    <div className="small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                      Vendor Ref: #{bill.supplierInvoiceNo}
                    </div>
                  )}
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
                  <div className="d-flex gap-1">
                    <span
                      className={`badge-status ${
                        isPaid ? 'badge-paid' : isPartial ? 'badge-partial' : 'badge-unpaid'
                      }`}
                      style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
                    >
                      {bill.paymentStatus?.toUpperCase()}
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
