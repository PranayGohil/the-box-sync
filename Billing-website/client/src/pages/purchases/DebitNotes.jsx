import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/DataTable';

export const DebitNotes = () => {
  const { addToast } = useToast();
  const [debitNotes, setDebitNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDebitNotes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchases/debit-notes');
      if (res.data.success) setDebitNotes(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load debit notes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebitNotes();
  }, []);

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Filtered Debit Notes
  const filteredNotes = debitNotes.filter((dn) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      dn.debitNoteNo?.toLowerCase().includes(term) ||
      dn.supplierNameSnapshot?.toLowerCase().includes(term) ||
      dn.originalPurchaseBillNo?.toLowerCase().includes(term)
    );
  });

  // Top Metrics Calculation
  const totalNotesCount = debitNotes.length;
  const totalDebitValue = debitNotes.reduce((sum, d) => sum + (d.grandTotal || 0), 0);
  const totalITCReversed = debitNotes.reduce((sum, d) => sum + (d.totalTax || 0), 0);
  const suppliersImpacted = new Set(debitNotes.map((d) => d.supplierId?._id || d.supplierId)).size;

  const columns = [
    {
      header: 'Debit Note #',
      accessor: 'debitNoteNo',
      render: (row) => (
        <div>
          <span className="fw-bold font-mono text-danger">#{row.debitNoteNo}</span>
          <div className="small text-muted">{new Date(row.date).toLocaleDateString('en-IN')}</div>
        </div>
      )
    },
    {
      header: 'Against Bill',
      accessor: 'originalPurchaseBillNo',
      render: (row) => (
        <span className="badge bg-light text-primary border font-mono">
          #{row.originalPurchaseBillNo || 'N/A'}
        </span>
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
      header: 'Taxable (₹)',
      accessor: 'taxableAmount',
      align: 'right',
      render: (row) => <span className="font-mono">₹{fmt(row.taxableAmount)}</span>
    },
    {
      header: 'ITC Reversal (₹)',
      accessor: 'totalTax',
      align: 'right',
      render: (row) => <span className="font-mono text-danger">₹{fmt(row.totalTax)}</span>
    },
    {
      header: 'Debit Total (₹)',
      accessor: 'grandTotal',
      align: 'right',
      render: (row) => <span className="fw-bold font-mono text-danger">₹{fmt(row.grandTotal)}</span>
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
    <div className="debit-notes-page-container">
      {/* 1. Header with Responsive Action Button */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Debit Notes & Purchase Returns
          </h4>
          <p className="text-muted small mb-0">
            Record supplier purchase returns, reverse input tax credits (ITC), and adjust accounts payable
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end">
          <NavLink
            to="/purchases/returns/new"
            className="btn btn-danger btn-sm flex-fill flex-sm-grow-0"
          >
            <i className="bi bi-journal-arrow-down"></i> Issue Debit Note
          </NavLink>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
              <i className="bi bi-journal-arrow-down"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL DEBIT NOTES</div>
              <div className="fw-bold font-mono text-truncate text-danger" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalDebitValue)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <i className="bi bi-shield-slash"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>ITC REVERSAL TOTAL</div>
              <div className="fw-bold font-mono text-truncate text-warning" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalITCReversed)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <i className="bi bi-receipt"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>DEBIT NOTES COUNT</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                {totalNotesCount} Notes
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
              <i className="bi bi-people"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>VENDORS ADJUSTED</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {suppliersImpacted} Suppliers
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
                placeholder="Search by debit note #, supplier name, bill ref #..."
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
              onClick={fetchDebitNotes}
              title="Refresh Debit Notes"
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
          data={filteredNotes}
          loading={loading}
          emptyMessage="No debit notes issued yet"
          emptyIcon="bi-journal-arrow-down"
        />
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="card-zenith p-4 text-center text-muted">
            <i className="bi bi-journal-arrow-down fs-1 d-block mb-2 text-danger opacity-50"></i>
            <div className="fw-bold">No Debit Notes Found</div>
            <div className="small">Click "Issue Debit Note" to record a purchase return.</div>
          </div>
        ) : (
          filteredNotes.map((dn) => (
            <div key={dn._id} className="invoice-card-mobile">
              {/* Header */}
              <div className="invoice-card-mobile-header">
                <div>
                  <span className="fw-bold font-mono text-danger fs-6">#{dn.debitNoteNo}</span>
                  <span className="text-muted ms-2" style={{ fontSize: '0.75rem' }}>
                    {new Date(dn.date).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="fw-extrabold font-mono fs-6 text-danger">
                  ₹{fmt(dn.grandTotal)}
                </div>
              </div>

              {/* Supplier & Bill Ref */}
              <div className="mb-2">
                <div className="fw-bold text-dark small">{dn.supplierNameSnapshot}</div>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <span className="badge bg-light text-primary border font-mono" style={{ fontSize: '0.68rem' }}>
                    Against #{dn.originalPurchaseBillNo || 'N/A'}
                  </span>
                  <span className="badge-status badge-finalized" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                    FINALIZED
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
