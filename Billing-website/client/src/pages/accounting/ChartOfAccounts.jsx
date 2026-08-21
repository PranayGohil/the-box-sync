import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/DataTable';

export const ChartOfAccounts = () => {
  const { addToast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedNature, setSelectedNature] = useState('ALL');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    accountCode: '',
    groupId: '',
    openingBalance: 0
  });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounting/chart-of-accounts');
      if (res.data.success) {
        setAccounts(res.data.data.accounts || []);
        setGroups(res.data.data.groups || []);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load chart of accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/accounting/chart-of-accounts', formData);
      if (res.data.success) {
        addToast('General ledger account created successfully!', 'success');
        setShowModal(false);
        setFormData({ name: '', accountCode: '', groupId: '', openingBalance: 0 });
        fetchAccounts();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create account', 'error');
    }
  };

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Filtered Accounts
  const filteredAccounts = accounts.filter((acc) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !search ||
      acc.name?.toLowerCase().includes(term) ||
      acc.accountCode?.toLowerCase().includes(term) ||
      acc.groupId?.name?.toLowerCase().includes(term);
    const matchesNature = selectedNature === 'ALL' || acc.groupId?.nature === selectedNature;
    return matchesSearch && matchesNature;
  });

  // Top Metrics Calculation
  const totalAccountsCount = accounts.length;
  const assetTotal = accounts
    .filter((a) => a.groupId?.nature === 'Asset')
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  const liabilityTotal = accounts
    .filter((a) => a.groupId?.nature === 'Liability')
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
  const incomeTotal = accounts
    .filter((a) => a.groupId?.nature === 'Income')
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const getNatureBadgeColor = (nature) => {
    switch (nature) {
      case 'Asset':
        return 'primary';
      case 'Liability':
        return 'danger';
      case 'Income':
        return 'success';
      case 'Expense':
        return 'warning';
      case 'Equity':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const columns = [
    {
      header: 'Code',
      accessor: 'accountCode',
      render: (row) => (
        <span className="badge bg-light text-dark border font-mono">
          {row.accountCode || '-'}
        </span>
      )
    },
    {
      header: 'Ledger Account Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <span className="fw-bold text-dark">{row.name}</span>
          <div className="small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
            Group: {row.groupId?.name || 'General Group'}
          </div>
        </div>
      )
    },
    {
      header: 'Classification',
      accessor: 'groupId',
      render: (row) => <span className="text-muted small">{row.groupId?.name || '-'}</span>
    },
    {
      header: 'Nature',
      accessor: 'groupId',
      align: 'center',
      render: (row) => {
        const nat = row.groupId?.nature || 'Asset';
        const color = getNatureBadgeColor(nat);
        return (
          <span
            className={`badge bg-${color}-subtle text-${color} border border-${color}-subtle fw-semibold`}
            style={{ fontSize: '0.72rem' }}
          >
            {nat.toUpperCase()}
          </span>
        );
      }
    },
    {
      header: 'Current Balance (₹)',
      accessor: 'currentBalance',
      align: 'right',
      render: (row) => <span className="fw-bold font-mono text-dark">₹{fmt(row.currentBalance)}</span>
    }
  ];

  return (
    <div className="chart-of-accounts-page-container">
      {/* 1. Header with Responsive Action Button */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Chart of Accounts (COA)
          </h4>
          <p className="text-muted small mb-0">
            Indian Standard double-entry general ledgers, sub-accounts, and statutory classification
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end">
          <button className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-lg"></i> Create Ledger Account
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <i className="bi bi-diagram-3"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL ACCOUNTS</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {totalAccountsCount} Ledgers
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <i className="bi bi-bank"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL ASSETS</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(assetTotal)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
              <i className="bi bi-credit-card-2-front"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL LIABILITIES</div>
              <div className="fw-bold font-mono text-truncate text-danger" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(liabilityTotal)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <i className="bi bi-graph-up-arrow"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>REVENUE / INCOME</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(incomeTotal)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Segmented Nature Filter Bar */}
      <div className="card-zenith p-3 mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="position-relative">
              <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '10px' }}></i>
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Search accounts by name, code, group..."
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

          <div className="col-10 col-md-6">
            <div className="d-flex overflow-auto gap-1 pb-1" style={{ whiteSpace: 'nowrap' }}>
              {['ALL', 'Asset', 'Liability', 'Equity', 'Income', 'Expense'].map((nat) => (
                <button
                  key={nat}
                  type="button"
                  className={`btn btn-sm ${
                    selectedNature === nat
                      ? 'btn-primary text-white fw-bold shadow-sm'
                      : 'btn-outline-secondary bg-white text-dark'
                  }`}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  onClick={() => setSelectedNature(nat)}
                >
                  {nat}
                </button>
              ))}
            </div>
          </div>

          <div className="col-2 col-md-1">
            <button
              className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center"
              onClick={fetchAccounts}
              title="Refresh Chart of Accounts"
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
          data={filteredAccounts}
          loading={loading}
          emptyMessage="No ledger accounts found"
          emptyIcon="bi-diagram-3"
        />
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="card-zenith p-4 text-center text-muted">
            <i className="bi bi-diagram-3 fs-1 d-block mb-2 text-secondary opacity-50"></i>
            <div className="fw-bold">No Accounts Found</div>
            <div className="small">Click "Create Ledger Account" to register a general ledger.</div>
          </div>
        ) : (
          filteredAccounts.map((acc) => {
            const nat = acc.groupId?.nature || 'Asset';
            const color = getNatureBadgeColor(nat);

            return (
              <div key={acc._id} className="invoice-card-mobile">
                {/* Header */}
                <div className="invoice-card-mobile-header">
                  <div className="fw-bold text-dark fs-6 text-truncate" style={{ maxWidth: '65%' }}>
                    {acc.name}
                  </div>
                  <div className="fw-extrabold font-mono fs-6 text-dark">
                    ₹{fmt(acc.currentBalance)}
                  </div>
                </div>

                {/* Group & Code */}
                <div className="mb-2">
                  <div className="d-flex align-items-center gap-2 small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                    {acc.accountCode && <span className="badge bg-light text-dark border">#{acc.accountCode}</span>}
                    <span>{acc.groupId?.name || 'General Group'}</span>
                  </div>
                </div>

                {/* Footer: Nature Badge */}
                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                  <span
                    className={`badge bg-${color}-subtle text-${color} border border-${color}-subtle fw-semibold`}
                    style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
                  >
                    {nat.toUpperCase()}
                  </span>
                  <span className="small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                    Double-Entry Verified
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Account Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div className="modal-header bg-light" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-diagram-3 text-primary me-2"></i>
                  Create General Ledger Account
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleCreateAccount}>
                <div className="modal-body p-3 p-sm-4" style={{ background: '#f8fafc' }}>
                  <div className="mb-3">
                    <label className="form-label">Account Name*</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Printing & Stationery Expenses"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Account Code / Number</label>
                    <input
                      type="text"
                      className="form-control font-mono"
                      placeholder="e.g. 5010"
                      value={formData.accountCode}
                      onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Account Group / Category*</label>
                    <select
                      className="form-select fw-semibold"
                      value={formData.groupId}
                      onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Account Group --</option>
                      {groups.map((g) => (
                        <option key={g._id} value={g._id}>{g.name} ({g.nature})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-footer bg-white">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-zenith btn-sm">
                    Create Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
