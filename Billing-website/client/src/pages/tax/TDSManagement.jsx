import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/DataTable';

export const TDSManagement = () => {
  const { addToast } = useToast();
  const [sections, setSections] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [search, setSearch] = useState('');

  const fetchTDS = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tax/tds');
      if (res.data.success) {
        setSections(res.data.data.sections || []);
        setTransactions(res.data.data.transactions || []);
        setSummary(res.data.data.summary);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load TDS data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTDS();
  }, []);

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Filtered lists
  const filteredTxns = transactions.filter((t) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      t.deducteeName?.toLowerCase().includes(term) ||
      t.sectionName?.toLowerCase().includes(term) ||
      t.voucherNo?.toLowerCase().includes(term)
    );
  });

  const filteredSections = sections.filter((s) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return s.section?.toLowerCase().includes(term) || s.name?.toLowerCase().includes(term);
  });

  const sectionColumns = [
    {
      header: 'Section Code',
      accessor: 'section',
      render: (row) => <span className="badge bg-light text-dark border font-mono fw-bold">Sec {row.section}</span>
    },
    {
      header: 'Section Name / Description',
      accessor: 'name',
      render: (row) => <span className="fw-bold text-dark">{row.name}</span>
    },
    {
      header: 'Applicable Rate %',
      accessor: 'rate',
      align: 'center',
      render: (row) => <span className="badge bg-primary-subtle text-primary fw-bold font-mono">{row.rate}%</span>
    },
    {
      header: 'Threshold Exemption Limit (₹)',
      accessor: 'thresholdLimit',
      align: 'right',
      render: (row) => <span className="font-mono fw-semibold">₹{row.thresholdLimit?.toLocaleString('en-IN')}</span>
    }
  ];

  const txnColumns = [
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => new Date(row.date).toLocaleDateString('en-IN')
    },
    {
      header: 'Deductee / Vendor Name',
      accessor: 'deducteeName',
      render: (row) => (
        <div>
          <span className="fw-bold text-dark">{row.deducteeName}</span>
          {row.voucherNo && <div className="small text-muted font-mono">Voucher: #{row.voucherNo}</div>}
        </div>
      )
    },
    {
      header: 'TDS Section',
      accessor: 'sectionName',
      render: (row) => <span className="badge bg-light text-dark border">{row.sectionName || 'Sec 194'}</span>
    },
    {
      header: 'Gross Amount (₹)',
      accessor: 'grossAmount',
      align: 'right',
      render: (row) => <span className="font-mono">₹{fmt(row.grossAmount)}</span>
    },
    {
      header: 'TDS Deducted (₹)',
      accessor: 'tdsAmount',
      align: 'right',
      render: (row) => (
        <span className="fw-bold font-mono text-danger">
          -₹{fmt(row.tdsAmount)} {row.tdsRate ? `(${row.tdsRate}%)` : ''}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (row) => {
        const isDeposited = row.status === 'deposited_to_govt';
        return (
          <span className={`badge ${isDeposited ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'}`}>
            {isDeposited ? 'DEPOSITED (281)' : 'PENDING DEPOSIT'}
          </span>
        );
      }
    }
  ];

  return (
    <div className="tds-management-page-container">
      {/* 1. Header with Responsive Action Buttons */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            TDS (Tax Deducted at Source) Management
          </h4>
          <p className="text-muted small mb-0">
            Track Section 194C, 194J, 194I vendor deductions, Challan 281 liabilities, and Form 26Q compliance
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end">
          <button className="btn btn-outline-secondary btn-sm flex-fill flex-sm-grow-0" onClick={() => window.print()}>
            <i className="bi bi-printer me-1"></i> Print / 26Q
          </button>
          <button className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0" onClick={fetchTDS}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
              <i className="bi bi-shield-lock"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL TDS DEDUCTED</div>
              <div className="fw-bold font-mono text-truncate text-danger" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(summary?.totalDeducted)}
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
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>DEPOSITED (CHALLAN 281)</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(summary?.totalDeposited)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <i className="bi bi-hourglass-bottom"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>OUTSTANDING PAYABLE</div>
              <div className="fw-bold font-mono text-truncate text-warning" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(summary?.totalPayable)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <i className="bi bi-journal-text"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>DEDUCTION ENTRIES</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                {transactions.length} Records
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Tabs Filter Bar */}
      <div className="card-zenith p-3 mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <div className="position-relative">
              <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '10px' }}></i>
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Search by deductee, section, or voucher #..."
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

          <div className="col-12 col-md-6 d-flex justify-content-md-end">
            <div className="btn-group w-100 w-md-auto">
              <button
                className={`btn btn-sm ${activeTab === 'summary' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTab('summary')}
              >
                Deductions Log ({filteredTxns.length})
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'sections' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTab('sections')}
              >
                Statutory Sections ({filteredSections.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Desktop & Tablet View (DataTable, hidden on mobile <768px) */}
      <div className="card-zenith d-none d-md-block">
        {activeTab === 'summary' ? (
          <DataTable
            columns={txnColumns}
            data={filteredTxns}
            loading={loading}
            emptyMessage="No TDS deduction transactions found"
            emptyIcon="bi-file-earmark-ruled"
          />
        ) : (
          <DataTable
            columns={sectionColumns}
            data={filteredSections}
            loading={loading}
            emptyMessage="No TDS sections configured"
            emptyIcon="bi-gear"
          />
        )}
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : activeTab === 'summary' ? (
          filteredTxns.length === 0 ? (
            <div className="card-zenith p-4 text-center text-muted">
              <i className="bi bi-file-earmark-ruled fs-1 d-block mb-2 text-secondary opacity-50"></i>
              <div className="fw-bold">No TDS Transactions Found</div>
              <div className="small">Record expenses with TDS to view deduction logs.</div>
            </div>
          ) : (
            filteredTxns.map((t, idx) => {
              const isDeposited = t.status === 'deposited_to_govt';

              return (
                <div key={idx} className="invoice-card-mobile">
                  {/* Header */}
                  <div className="invoice-card-mobile-header">
                    <div className="fw-bold text-dark fs-6 text-truncate" style={{ maxWidth: '65%' }}>
                      {t.deducteeName}
                    </div>
                    <div className="fw-extrabold font-mono fs-6 text-danger">
                      -₹{fmt(t.tdsAmount)}
                    </div>
                  </div>

                  {/* Section & Date */}
                  <div className="mb-2">
                    <div className="d-flex align-items-center gap-2 small">
                      <span className="badge bg-light text-dark border font-mono">{t.sectionName || 'Sec 194'}</span>
                      <span className="text-muted">{new Date(t.date).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Footer: Gross & Status */}
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top font-mono small">
                    <span className="text-muted">Gross: <strong>₹{fmt(t.grossAmount)}</strong></span>
                    <span
                      className={`badge ${
                        isDeposited
                          ? 'bg-success-subtle text-success border border-success-subtle'
                          : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                      }`}
                      style={{ fontSize: '0.68rem' }}
                    >
                      {isDeposited ? 'DEPOSITED' : 'PENDING'}
                    </span>
                  </div>
                </div>
              );
            })
          )
        ) : (
          filteredSections.length === 0 ? (
            <div className="card-zenith p-4 text-center text-muted">No sections configured</div>
          ) : (
            filteredSections.map((s, idx) => (
              <div key={idx} className="invoice-card-mobile">
                <div className="invoice-card-mobile-header">
                  <span className="badge bg-light text-dark border font-mono fw-bold fs-6">Sec {s.section}</span>
                  <span className="badge bg-primary-subtle text-primary fw-bold font-mono fs-6">{s.rate}%</span>
                </div>
                <div className="fw-bold text-dark small my-1">{s.name}</div>
                <div className="small text-muted font-mono pt-1 border-top">
                  Exemption Threshold: <strong>₹{s.thresholdLimit?.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
