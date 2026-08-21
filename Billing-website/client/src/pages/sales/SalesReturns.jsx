import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/DataTable';

export const SalesReturns = () => {
  const { addToast } = useToast();
  const [returns, setReturns] = useState([]);
  const [creditNotes, setCreditNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('returns');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [retRes, cnRes] = await Promise.all([
        api.get('/sales/returns'),
        api.get('/sales/credit-notes')
      ]);
      if (retRes.data.success) setReturns(retRes.data.data);
      if (cnRes.data.success) setCreditNotes(cnRes.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load sales returns & credit notes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Top Metrics Calculation
  const totalReturnsCount = returns.length;
  const totalReturnValue = returns.reduce((sum, r) => sum + (r.grandTotal || 0), 0);
  const totalCreditNotesCount = creditNotes.length;
  const totalCreditNoteValue = creditNotes.reduce((sum, c) => sum + (c.grandTotal || 0), 0);

  // Filtered Returns
  const filteredReturns = returns.filter((r) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      r.returnNo?.toLowerCase().includes(term) ||
      r.customerNameSnapshot?.toLowerCase().includes(term) ||
      r.invoiceId?.invoiceNo?.toLowerCase().includes(term)
    );
  });

  // Filtered Credit Notes
  const filteredCreditNotes = creditNotes.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      c.creditNoteNo?.toLowerCase().includes(term) ||
      c.customerNameSnapshot?.toLowerCase().includes(term) ||
      c.originalInvoiceNo?.toLowerCase().includes(term)
    );
  });

  const returnColumns = [
    {
      header: 'Return #',
      accessor: 'returnNo',
      render: (row) => (
        <div>
          <span className="fw-bold font-mono text-danger">#{row.returnNo}</span>
          <div className="small text-muted">{new Date(row.date).toLocaleDateString('en-IN')}</div>
        </div>
      )
    },
    {
      header: 'Original Invoice',
      accessor: 'invoiceId',
      render: (row) => (
        <span className="badge bg-light text-primary border font-mono">
          #{row.invoiceId?.invoiceNo || 'N/A'}
        </span>
      )
    },
    {
      header: 'Customer',
      accessor: 'customerNameSnapshot',
      render: (row) => <div className="fw-bold text-dark">{row.customerNameSnapshot}</div>
    },
    {
      header: 'Return Total (₹)',
      accessor: 'grandTotal',
      align: 'right',
      render: (row) => <span className="fw-bold font-mono text-danger">₹{fmt(row.grandTotal)}</span>
    },
    {
      header: 'Warehouse Restocked',
      accessor: 'stockRestocked',
      align: 'center',
      render: (row) => (
        <span
          className={`badge ${
            row.stockRestocked
              ? 'bg-success-subtle text-success border border-success-subtle'
              : 'bg-light text-muted border'
          }`}
        >
          {row.stockRestocked ? '✓ YES (+Stock In)' : 'No'}
        </span>
      )
    }
  ];

  const creditNoteColumns = [
    {
      header: 'Credit Note #',
      accessor: 'creditNoteNo',
      render: (row) => (
        <div>
          <span className="fw-bold font-mono text-primary">#{row.creditNoteNo}</span>
          <div className="small text-muted">{new Date(row.date).toLocaleDateString('en-IN')}</div>
        </div>
      )
    },
    {
      header: 'Against Invoice',
      accessor: 'originalInvoiceNo',
      render: (row) => (
        <span className="badge bg-light text-muted border font-mono">
          #{row.originalInvoiceNo || 'N/A'}
        </span>
      )
    },
    {
      header: 'Customer',
      accessor: 'customerNameSnapshot',
      render: (row) => <div className="fw-bold text-dark">{row.customerNameSnapshot}</div>
    },
    {
      header: 'Taxable (₹)',
      accessor: 'taxableAmount',
      align: 'right',
      render: (row) => <span className="font-mono text-muted">₹{fmt(row.taxableAmount)}</span>
    },
    {
      header: 'Credit Total (₹)',
      accessor: 'grandTotal',
      align: 'right',
      render: (row) => <span className="fw-bold font-mono text-success">₹{fmt(row.grandTotal)}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (row) => (
        <span className="badge-status badge-finalized">
          {row.status?.toUpperCase() || 'FINALIZED'}
        </span>
      )
    }
  ];

  return (
    <div className="sales-returns-page-container">
      {/* 1. Header with Responsive Action Button */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Sales Returns & Credit Notes
          </h4>
          <p className="text-muted small mb-0">
            Process customer returns, replenish inventory stock, and issue GST Credit Notes
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end">
          <NavLink
            to="/sales/returns/new"
            className="btn btn-danger btn-sm flex-fill flex-sm-grow-0"
          >
            <i className="bi bi-arrow-counterclockwise"></i> Process Sales Return
          </NavLink>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
              <i className="bi bi-arrow-counterclockwise"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL RETURN VALUE</div>
              <div className="fw-bold font-mono text-truncate text-danger" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalReturnValue)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <i className="bi bi-journal-arrow-down"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>CREDIT NOTES ISSUED</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalCreditNoteValue)}
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
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>RETURNS LOGGED</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                {totalReturnsCount} Returns
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
              <i className="bi bi-receipt"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>CREDIT NOTES COUNT</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {totalCreditNotesCount} Notes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Segmented Tab Switcher & Search Bar */}
      <div className="card-zenith p-3 mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn btn-sm ${
                  activeTab === 'returns' ? 'btn-danger fw-bold' : 'btn-outline-secondary'
                }`}
                onClick={() => setActiveTab('returns')}
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i> Sales Returns ({returns.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${
                  activeTab === 'credit_notes' ? 'btn-primary fw-bold' : 'btn-outline-secondary'
                }`}
                onClick={() => setActiveTab('credit_notes')}
              >
                <i className="bi bi-journal-arrow-down me-1"></i> Credit Notes ({creditNotes.length})
              </button>
            </div>
          </div>

          <div className="col-10 col-md-5">
            <div className="position-relative">
              <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '10px' }}></i>
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Search by doc #, customer, invoice..."
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
              onClick={fetchData}
              title="Refresh Data"
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Desktop & Tablet View (DataTable, hidden on mobile <768px) */}
      <div className="card-zenith d-none d-md-block">
        {activeTab === 'returns' ? (
          <DataTable
            columns={returnColumns}
            data={filteredReturns}
            loading={loading}
            emptyMessage="No sales returns recorded"
            emptyIcon="bi-arrow-counterclockwise"
          />
        ) : (
          <DataTable
            columns={creditNoteColumns}
            data={filteredCreditNotes}
            loading={loading}
            emptyMessage="No credit notes issued"
            emptyIcon="bi-journal-arrow-down"
          />
        )}
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : activeTab === 'returns' ? (
          filteredReturns.length === 0 ? (
            <div className="card-zenith p-4 text-center text-muted">
              <i className="bi bi-arrow-counterclockwise fs-1 d-block mb-2 text-danger opacity-50"></i>
              <div className="fw-bold">No Sales Returns Found</div>
              <div className="small">Click "Process Sales Return" to record returned goods.</div>
            </div>
          ) : (
            filteredReturns.map((ret) => (
              <div key={ret._id} className="invoice-card-mobile">
                {/* Header */}
                <div className="invoice-card-mobile-header">
                  <div>
                    <span className="fw-bold font-mono text-danger fs-6">#{ret.returnNo}</span>
                    <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
                      {new Date(ret.date).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div className="fw-extrabold font-mono fs-6 text-danger">
                    ₹{fmt(ret.grandTotal)}
                  </div>
                </div>

                {/* Details */}
                <div className="mb-2">
                  <div className="fw-bold text-dark small">{ret.customerNameSnapshot}</div>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <span className="badge bg-light text-primary border font-mono" style={{ fontSize: '0.68rem' }}>
                      Inv #{ret.invoiceId?.invoiceNo || 'N/A'}
                    </span>
                    <span
                      className={`badge ${
                        ret.stockRestocked
                          ? 'bg-success-subtle text-success border border-success-subtle'
                          : 'bg-light text-muted border'
                      }`}
                      style={{ fontSize: '0.68rem' }}
                    >
                      {ret.stockRestocked ? '✓ Stock Restocked' : 'No Restock'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          filteredCreditNotes.length === 0 ? (
            <div className="card-zenith p-4 text-center text-muted">
              <i className="bi bi-journal-arrow-down fs-1 d-block mb-2 text-primary opacity-50"></i>
              <div className="fw-bold">No Credit Notes Found</div>
              <div className="small">Credit notes are generated automatically upon return.</div>
            </div>
          ) : (
            filteredCreditNotes.map((cn) => (
              <div key={cn._id} className="invoice-card-mobile">
                {/* Header */}
                <div className="invoice-card-mobile-header">
                  <div>
                    <span className="fw-bold font-mono text-primary fs-6">#{cn.creditNoteNo}</span>
                    <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
                      {new Date(cn.date).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div className="fw-extrabold font-mono fs-6 text-success">
                    ₹{fmt(cn.grandTotal)}
                  </div>
                </div>

                {/* Details */}
                <div className="mb-2">
                  <div className="fw-bold text-dark small">{cn.customerNameSnapshot}</div>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <span className="badge bg-light text-muted border font-mono" style={{ fontSize: '0.68rem' }}>
                      Against #{cn.originalInvoiceNo || 'N/A'}
                    </span>
                    <span className="badge-status badge-finalized" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                      FINALIZED
                    </span>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
