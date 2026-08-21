import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/DataTable';

export const AuditLogs = () => {
  const { addToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/audit-logs');
      if (res.data.success) setLogs(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filtered Logs
  const filteredLogs = logs.filter((log) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !search ||
      log.documentNumber?.toLowerCase().includes(term) ||
      log.module?.toLowerCase().includes(term) ||
      log.documentType?.toLowerCase().includes(term) ||
      log.ipAddress?.toLowerCase().includes(term) ||
      log.action?.toLowerCase().includes(term);
    const matchesModule = !moduleFilter || log.module === moduleFilter;
    const matchesAction = !actionFilter || log.action === actionFilter;
    return matchesSearch && matchesModule && matchesAction;
  });

  // Top Metrics Calculation
  const totalEvents = logs.length;
  const createEvents = logs.filter((l) => l.action === 'create' || l.action === 'insert').length;
  const updateEvents = logs.filter((l) => l.action === 'update' || l.action === 'edit').length;
  const cancelEvents = logs.filter((l) => l.action === 'cancel' || l.action === 'delete').length;

  const getActionBadge = (action) => {
    const act = (action || '').toLowerCase();
    if (act === 'cancel' || act === 'delete') {
      return <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-bold">{action?.toUpperCase()}</span>;
    } else if (act === 'create' || act === 'insert') {
      return <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold">{action?.toUpperCase()}</span>;
    } else if (act === 'update' || act === 'edit') {
      return <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold">{action?.toUpperCase()}</span>;
    }
    return <span className="badge bg-secondary-subtle text-secondary border fw-bold text-uppercase">{action || 'EVENT'}</span>;
  };

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      render: (row) => (
        <div className="small font-mono">
          <div className="text-dark fw-bold">{new Date(row.timestamp).toLocaleDateString('en-IN')}</div>
          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
            {new Date(row.timestamp).toLocaleTimeString('en-IN')}
          </div>
        </div>
      )
    },
    {
      header: 'Module',
      accessor: 'module',
      render: (row) => (
        <span className="badge bg-light text-dark border text-uppercase" style={{ fontSize: '0.72rem' }}>
          {row.module}
        </span>
      )
    },
    {
      header: 'Action',
      accessor: 'action',
      align: 'center',
      render: (row) => getActionBadge(row.action)
    },
    {
      header: 'Document / Record #',
      accessor: 'documentNumber',
      render: (row) => (
        <div>
          <span className="font-mono fw-bold text-primary">#{row.documentNumber || '-'}</span>
          <div className="small text-muted text-capitalize">{row.documentType || 'Entity'}</div>
        </div>
      )
    },
    {
      header: 'IP Address / Node',
      accessor: 'ipAddress',
      render: (row) => <span className="font-mono small text-muted">{row.ipAddress || '127.0.0.1'}</span>
    }
  ];

  return (
    <div className="audit-logs-page-container">
      {/* 1. Header with Responsive Action Button */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            System Audit Trail & Security Logs
          </h4>
          <p className="text-muted small mb-0">
            Immutable compliance record tracking all user creations, modifications, cancellations, and IP origins
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end">
          <button
            className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0 d-flex align-items-center justify-content-center gap-1"
            onClick={fetchLogs}
          >
            <i className="bi bi-arrow-clockwise"></i> Refresh Logs
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <i className="bi bi-activity"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL EVENTS</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {totalEvents} Logs
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <i className="bi bi-plus-circle"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>NEW CREATIONS</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                {createEvents} Events
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <i className="bi bi-pencil-square"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>MODIFICATIONS</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                {updateEvents} Events
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
              <i className="bi bi-x-circle"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>CANCELLATIONS</div>
              <div className="fw-bold font-mono text-truncate text-danger" style={{ fontSize: '0.95rem' }}>
                {cancelEvents} Events
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
                placeholder="Search by document #, module, IP address..."
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
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <option value="">All Modules</option>
              <option value="invoices">Invoices</option>
              <option value="purchase_bills">Purchase Bills</option>
              <option value="payments">Payments</option>
              <option value="inventory">Inventory</option>
              <option value="accounting">Accounting</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm fw-semibold"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="">All Actions</option>
              <option value="create">CREATE</option>
              <option value="update">UPDATE</option>
              <option value="cancel">CANCEL</option>
              <option value="delete">DELETE</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Desktop & Tablet View (DataTable, hidden on mobile <768px) */}
      <div className="card-zenith d-none d-md-block">
        <DataTable
          columns={columns}
          data={filteredLogs}
          loading={loading}
          emptyMessage="No audit logs recorded"
          emptyIcon="bi-activity"
        />
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="card-zenith p-4 text-center text-muted">
            <i className="bi bi-activity fs-1 d-block mb-2 text-secondary opacity-50"></i>
            <div className="fw-bold">No Audit Events Found</div>
            <div className="small">Perform transactions across the ERP to log compliance activity.</div>
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div key={idx} className="invoice-card-mobile">
              {/* Header */}
              <div className="invoice-card-mobile-header">
                <div>
                  <span className="font-mono fw-bold text-primary fs-6">#{log.documentNumber || '-'}</span>
                  <span className="badge bg-light text-dark border text-uppercase ms-2" style={{ fontSize: '0.68rem' }}>
                    {log.module}
                  </span>
                </div>
                {getActionBadge(log.action)}
              </div>

              {/* Document Type & Timestamp */}
              <div className="mb-2">
                <div className="small text-dark fw-semibold text-capitalize">{log.documentType || 'Transaction Record'}</div>
                <div className="small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                  {new Date(log.timestamp).toLocaleString('en-IN')}
                </div>
              </div>

              {/* IP / Origin */}
              <div className="pt-2 border-top d-flex justify-content-between align-items-center font-mono small text-muted">
                <span>Origin IP:</span>
                <span className="badge bg-light text-muted border">{log.ipAddress || '127.0.0.1'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
