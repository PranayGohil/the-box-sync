import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/DataTable';

export const Quotations = () => {
  const { addToast } = useToast();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales/quotations');
      if (res.data.success) setQuotations(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load quotations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleConvertToSO = async (quoteId) => {
    try {
      const res = await api.post(`/sales/quotations/${quoteId}/convert-so`);
      if (res.data.success) {
        addToast('Quotation converted to Sales Order successfully!', 'success');
        fetchQuotations();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to convert quotation', 'error');
    }
  };

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Filtered quotations
  const filteredQuotes = quotations.filter((q) => {
    const matchesSearch =
      !search ||
      q.quotationNo?.toLowerCase().includes(search.toLowerCase()) ||
      q.customerNameSnapshot?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Top Metrics Calculation
  const totalQuotesCount = quotations.length;
  const totalEstimatedValue = quotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0);
  const convertedQuotes = quotations.filter((q) => q.status === 'converted');
  const convertedValue = convertedQuotes.reduce((sum, q) => sum + (q.grandTotal || 0), 0);
  const pendingQuotes = quotations.filter((q) => q.status !== 'converted');
  const pendingValue = pendingQuotes.reduce((sum, q) => sum + (q.grandTotal || 0), 0);

  const columns = [
    {
      header: 'Quote #',
      accessor: 'quotationNo',
      render: (row) => (
        <div>
          <span className="fw-bold font-mono text-primary">#{row.quotationNo}</span>
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
      header: 'Valid Until',
      accessor: 'validUntil',
      render: (row) => (
        <span className="small text-muted font-mono">
          {row.validUntil ? new Date(row.validUntil).toLocaleDateString('en-IN') : 'Open'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (row) => (
        <span
          className={`badge-status ${
            row.status === 'converted' ? 'badge-paid' : 'badge-finalized'
          }`}
        >
          {row.status === 'converted' ? 'CONVERTED TO SO' : row.status?.toUpperCase() || 'DRAFT'}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div>
          {row.status !== 'converted' ? (
            <button
              className="btn btn-sm btn-outline-success py-1 px-2 d-flex align-items-center gap-1"
              onClick={() => handleConvertToSO(row._id)}
              title="Convert to Sales Order"
            >
              <i className="bi bi-arrow-right-circle"></i> Convert to SO
            </button>
          ) : (
            <span className="badge bg-light text-success border">
              <i className="bi bi-check2"></i> Converted
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="quotations-page-container">
      {/* 1. Header with Responsive Action Button */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Quotations & Price Estimates
          </h4>
          <p className="text-muted small mb-0">
            Issue formal price estimates and convert directly to Sales Orders or GST Invoices
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end">
          <NavLink
            to="/sales/quotations/new"
            className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0"
          >
            <i className="bi bi-plus-lg"></i> Create Quotation
          </NavLink>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <i className="bi bi-file-earmark-text"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL ESTIMATES</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalEstimatedValue)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <i className="bi bi-check2-circle"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>CONVERTED ORDERS</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(convertedValue)}
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
            <div className="metric-tile-icon" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
              <i className="bi bi-list-check"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL QUOTES</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {totalQuotesCount} Quotes
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
                placeholder="Search by quote #, customer name..."
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
              <option value="">All Quotation Statuses</option>
              <option value="draft">Draft / Finalized</option>
              <option value="converted">Converted to SO</option>
            </select>
          </div>

          <div className="col-4 col-md-1">
            <button
              className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
              onClick={fetchQuotations}
              title="Refresh Quotations"
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
          data={filteredQuotes}
          loading={loading}
          emptyMessage="No quotations created yet"
          emptyIcon="bi-file-earmark-text"
        />
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="card-zenith p-4 text-center text-muted">
            <i className="bi bi-file-earmark-text fs-1 d-block mb-2 text-secondary opacity-50"></i>
            <div className="fw-bold">No Quotations Found</div>
            <div className="small">Click "Create Quotation" to generate your first estimate.</div>
          </div>
        ) : (
          filteredQuotes.map((q) => (
            <div key={q._id} className="invoice-card-mobile">
              {/* Header Line */}
              <div className="invoice-card-mobile-header">
                <div>
                  <span className="fw-bold font-mono text-primary fs-6">#{q.quotationNo}</span>
                  <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
                    {new Date(q.date).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="fw-extrabold font-mono fs-6 text-dark">
                  ₹{fmt(q.grandTotal)}
                </div>
              </div>

              {/* Customer Details */}
              <div className="mb-2">
                <div className="fw-bold text-dark small">{q.customerNameSnapshot}</div>
                <div className="small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                  Valid Until: {q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-IN') : 'Open'}
                </div>
              </div>

              {/* Status Badge & Actions */}
              <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                <span
                  className={`badge-status ${
                    q.status === 'converted' ? 'badge-paid' : 'badge-finalized'
                  }`}
                  style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
                >
                  {q.status === 'converted' ? 'CONVERTED' : 'DRAFT'}
                </span>

                {q.status !== 'converted' ? (
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm py-1 px-3 fw-bold d-flex align-items-center gap-1"
                    style={{ fontSize: '0.78rem' }}
                    onClick={() => handleConvertToSO(q._id)}
                  >
                    <i className="bi bi-arrow-right-circle"></i> Convert to SO
                  </button>
                ) : (
                  <span className="text-success small fw-bold">
                    <i className="bi bi-check2-all me-1"></i> Order Created
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
