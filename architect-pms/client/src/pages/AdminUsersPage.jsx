import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { useModal } from '../context/ModalContext';
import LoadingGlass from '../components/LoadingGlass';
import PageHeader from '../components/common/PageHeader';
import PrismButton from '../components/common/PrismButton';
import { Shield, UserPlus, Edit3, Key, Mail, Phone, X } from 'lucide-react';
import { Modal } from 'react-bootstrap';

/* ── Inline Helpers ───────────────────────────────── */
const inpStyle = {
  width: '100%',
  height: '38px',
  background: '#f8fafc',
  border: '1.5px solid #e2e8f0',
  borderRadius: '8px',
  padding: '0 12px',
  fontSize: '0.855rem',
  color: '#0f172a',
  fontFamily: 'var(--font-main)',
  outline: 'none',
  transition: 'all 0.18s ease',
};

const onF = (e) => {
  e.target.style.borderColor = 'var(--accent-primary)';
  e.target.style.boxShadow = '0 0 0 3px rgba(79,110,247,0.12)';
  e.target.style.background = '#fff';
};

const onB = (e) => {
  e.target.style.borderColor = '#e2e8f0';
  e.target.style.boxShadow = 'none';
  e.target.style.background = '#f8fafc';
};

const AdminUsersPage = () => {
  const { showAlert } = useModal();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Password@123',
    role: 'staff',
    phone: '',
    status: 'active',
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI('/admin/users');
      if (res.success) setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: 'Password@123',
      role: 'staff',
      phone: '',
      status: 'active',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user._id);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
      status: user.status || 'active',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await fetchAPI(`/admin/users/${editingUser}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        showAlert({ title: 'User Updated', message: 'User account updated successfully.', type: 'success' });
      } else {
        await fetchAPI('/admin/users', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        showAlert({ title: 'User Created', message: 'New user account created successfully.', type: 'success' });
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      showAlert({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  if (loading) return <LoadingGlass message="Loading User Accounts & Roles..." />;

  return (
    <div>
      <PageHeader
        title="User Accounts & RBAC"
        subtitle="Manage staff profiles, permissions, and system roles"
        icon={Shield}
        iconColor="#f59e0b"
        iconBg="#fffbeb"
      >
        <PrismButton
          variant="primary"
          icon={UserPlus}
          onClick={handleOpenAdd}
        >
          Create New User
        </PrismButton>
      </PageHeader>

      <div className="responsive-card-view">
        {/* Desktop Table View */}
        <div
          className="table-desktop"
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['User Name', 'Email Address', 'Assigned Role', 'Phone', 'Status', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '0.85rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      color: '#94a3b8',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr
                  key={u._id}
                  style={{
                    borderBottom: idx < users.length - 1 ? '1px solid #f1f5f9' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'var(--prism-gradient)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          flexShrink: 0,
                        }}
                      >
                        {u.name ? u.name.charAt(0) : 'U'}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                        {u.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.845rem', color: 'var(--text-secondary)' }}>
                    {u.email}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span
                      style={{
                        background: '#eff1fe',
                        border: '1px solid #c7d2fe',
                        color: 'var(--accent-primary)',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {u.phone || '—'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        borderRadius: '99px',
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: u.status === 'active' ? '#ecfdf5' : '#f1f5f9',
                        color: u.status === 'active' ? '#10b981' : '#94a3b8',
                        border: `1px solid ${u.status === 'active' ? '#a7f3d0' : '#e2e8f0'}`,
                        textTransform: 'capitalize',
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: u.status === 'active' ? '#10b981' : '#94a3b8',
                        }}
                      />
                      {u.status || 'active'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <PrismButton
                      variant="secondary"
                      size="sm"
                      icon={Edit3}
                      onClick={() => handleOpenEdit(u)}
                    >
                      Edit
                    </PrismButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="cards-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {users.map((u) => (
            <div
              key={u._id}
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem 1.1rem',
                boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <span
                  style={{
                    background: '#eff1fe',
                    border: '1px solid #c7d2fe',
                    color: 'var(--accent-primary)',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                  }}
                >
                  {u.role}
                </span>
                <span
                  style={{
                    borderRadius: '99px',
                    padding: '2px 8px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: u.status === 'active' ? '#ecfdf5' : '#f1f5f9',
                    color: u.status === 'active' ? '#10b981' : '#94a3b8',
                  }}
                >
                  {u.status || 'active'}
                </span>
              </div>

              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0 0 0.35rem' }}>
                {u.name}
              </h3>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                <Mail size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {u.email}
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                <Phone size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {u.phone || 'No phone'}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  paddingTop: '0.6rem',
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                <button
                  onClick={() => handleOpenEdit(u)}
                  style={{
                    background: '#eff1fe',
                    border: '1px solid #c7d2fe',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                  }}
                >
                  <Edit3 size={13} style={{ marginRight: 4 }} /> Edit User
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Create/Edit User */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}
        >
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>
              {editingUser ? 'Edit User Account' : 'Create User Account'}
            </h3>
            <button
              onClick={() => setShowModal(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem',
                  }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={inpStyle}
                  onFocus={onF}
                  onBlur={onB}
                  required
                />
              </div>

              {!editingUser && (
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={inpStyle}
                    onFocus={onF}
                    onBlur={onB}
                    required
                  />
                </div>
              )}

              <div className="row g-2" style={{ marginBottom: '1rem' }}>
                <div className="col-12 col-md-6">
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      marginBottom: '0.35rem',
                    }}
                  >
                    System Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{ ...inpStyle, cursor: 'pointer' }}
                    onFocus={onF}
                    onBlur={onB}
                  >
                    <option value="admin">Admin / Partner</option>
                    <option value="architect">Architect</option>
                    <option value="staff">Office Staff</option>
                    <option value="site_engineer">Site Engineer</option>
                    <option value="client">Client (Read-only)</option>
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={inpStyle}
                    onFocus={onF}
                    onBlur={onB}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem',
                  }}
                >
                  {editingUser ? 'Reset Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={inpStyle}
                  onFocus={onF}
                  onBlur={onB}
                  required={!editingUser}
                />
              </div>
            </div>

            <div className="form-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="prism-btn prism-btn-primary prism-btn-md"
              >
                Save User
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
