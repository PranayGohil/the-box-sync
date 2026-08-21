import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/DataTable';

export const MembersSettings = () => {
  const { addToast } = useToast();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    role: 'billing_user'
  });

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/businesses/members');
      if (res.data.success) setMembers(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load team members', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      addToast('Please provide a valid email address', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/businesses/members', formData);
      if (res.data.success) {
        addToast('Team member added successfully!', 'success');
        setShowModal(false);
        setFormData({ email: '', role: 'billing_user' });
        fetchMembers();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add member', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered members
  const filteredMembers = members.filter((m) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !search ||
      m.userId?.name?.toLowerCase().includes(term) ||
      m.userId?.email?.toLowerCase().includes(term) ||
      m.role?.toLowerCase().includes(term);
    const matchesRole = !roleFilter || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Top Metrics Calculation
  const totalMembersCount = members.length;
  const adminCount = members.filter((m) => m.role === 'owner' || m.role === 'admin').length;
  const accountantCount = members.filter((m) => m.role === 'accountant').length;
  const staffCount = members.filter((m) => m.role === 'billing_user' || m.role === 'inventory_manager').length;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner':
      case 'admin':
        return <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold">ADMINISTRATOR</span>;
      case 'accountant':
        return <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold">ACCOUNTANT</span>;
      case 'inventory_manager':
        return <span className="badge bg-info-subtle text-info border border-info-subtle fw-bold">INVENTORY MGR</span>;
      case 'billing_user':
        return <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle fw-bold">BILLING STAFF</span>;
      default:
        return <span className="badge bg-secondary-subtle text-secondary border fw-bold text-uppercase">{role || 'MEMBER'}</span>;
    }
  };

  const columns = [
    {
      header: 'Member Name & Email',
      accessor: 'userId',
      render: (row) => (
        <div>
          <div className="fw-bold text-dark">{row.userId?.name || 'Authorized Member'}</div>
          <div className="small text-muted font-mono">{row.userId?.email || '-'}</div>
        </div>
      )
    },
    {
      header: 'Assigned Role',
      accessor: 'role',
      align: 'center',
      render: (row) => getRoleBadge(row.role)
    },
    {
      header: 'Branch Scope',
      accessor: 'isAllBranches',
      align: 'center',
      render: (row) => (
        <span className="badge bg-light text-dark border font-mono">
          {row.isAllBranches ? 'All Branches' : 'Assigned Only'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (row) => (
        <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold">
          {row.status?.toUpperCase() || 'ACTIVE'}
        </span>
      )
    }
  ];

  return (
    <div className="members-settings-page-container">
      {/* 1. Header with Responsive Action Button */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Team Members & Granular RBAC Permissions
          </h4>
          <p className="text-muted small mb-0">
            Manage authorized users, role assignments, module permissions, and branch/warehouse access control
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end">
          <button
            className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0 d-flex align-items-center justify-content-center gap-1"
            onClick={() => setShowModal(true)}
          >
            <i className="bi bi-person-plus-fill"></i> Add Team Member
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <i className="bi bi-people"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL TEAM</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {totalMembersCount} Members
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <i className="bi bi-shield-check"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>ADMINISTRATORS</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                {adminCount} Admins
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <i className="bi bi-calculator"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>FINANCE / ACCOUNTS</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                {accountantCount} Accountants
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <i className="bi bi-person-badge"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>OPERATIONS & STAFF</div>
              <div className="fw-bold font-mono text-truncate text-warning-emphasis" style={{ fontSize: '0.95rem' }}>
                {staffCount} Staff
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Role Filter Bar */}
      <div className="card-zenith p-3 mb-3">
        <div className="row g-2">
          <div className="col-12 col-md-7">
            <div className="position-relative">
              <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '10px' }}></i>
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Search by member name, email, or role..."
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

          <div className="col-10 col-md-4">
            <select
              className="form-select form-select-sm fw-semibold"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Assigned Roles</option>
              <option value="owner">Owner / Principal</option>
              <option value="admin">Administrator</option>
              <option value="accountant">Accountant</option>
              <option value="inventory_manager">Inventory Manager</option>
              <option value="billing_user">Billing Staff</option>
              <option value="viewer">Viewer / Auditor</option>
            </select>
          </div>

          <div className="col-2 col-md-1">
            <button
              className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center"
              onClick={fetchMembers}
              title="Refresh Members"
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
          data={filteredMembers}
          loading={loading}
          emptyMessage="No team members found"
          emptyIcon="bi-shield-lock"
        />
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="card-zenith p-4 text-center text-muted">
            <i className="bi bi-people fs-1 d-block mb-2 text-secondary opacity-50"></i>
            <div className="fw-bold">No Members Found</div>
            <div className="small">Click "Add Team Member" to invite your colleagues.</div>
          </div>
        ) : (
          filteredMembers.map((m, idx) => (
            <div key={idx} className="invoice-card-mobile">
              {/* Header */}
              <div className="invoice-card-mobile-header">
                <div className="fw-bold text-dark fs-6 text-truncate" style={{ maxWidth: '65%' }}>
                  {m.userId?.name || 'Authorized User'}
                </div>
                <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.68rem' }}>
                  {m.status?.toUpperCase() || 'ACTIVE'}
                </span>
              </div>

              {/* Email & Scope */}
              <div className="mb-2">
                <div className="small text-muted font-mono">{m.userId?.email || '-'}</div>
                <div className="small text-muted mt-1">
                  Scope: <span className="badge bg-light text-dark border font-mono" style={{ fontSize: '0.68rem' }}>{m.isAllBranches ? 'All Branches' : 'Assigned Branch'}</span>
                </div>
              </div>

              {/* Role */}
              <div className="pt-2 border-top">
                {getRoleBadge(m.role)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div className="modal-header bg-light" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person-plus text-primary me-2"></i>
                  Invite Team Member
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleAddMember}>
                <div className="modal-body p-3 p-sm-4" style={{ background: '#f8fafc' }}>
                  <div className="mb-3">
                    <label className="form-label">User Email Address*</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="colleague@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                    <div className="form-text small text-muted">
                      An invitation will be linked to this user's registered email.
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Role & Privilege Assignment*</label>
                    <select
                      className="form-select fw-semibold"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="admin">Administrator (Full Business & Billing Privileges)</option>
                      <option value="accountant">Accountant (Accounting, Tax, GSTR, Billing, Reports)</option>
                      <option value="inventory_manager">Inventory Manager (Stock, Warehouses, GRN)</option>
                      <option value="billing_user">Billing Staff (POS, Sales Invoices, Estimates)</option>
                      <option value="viewer">Auditor / Viewer (Read-Only Access)</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer bg-white">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-zenith btn-sm" disabled={submitting}>
                    {submitting ? 'Adding...' : 'Add Team Member'}
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
