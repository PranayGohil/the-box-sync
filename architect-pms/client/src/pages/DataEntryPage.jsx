import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { useModal } from '../context/ModalContext';
import LoadingGlass from '../components/LoadingGlass';
import PageHeader from '../components/common/PageHeader';
import PrismButton from '../components/common/PrismButton';
import { formatDate } from '../utils/dateUtils';
import {
  Users,
  UserPlus,
  Upload,
  Edit3,
  Trash2,
  ShieldAlert,
  Search,
  FileSpreadsheet,
  Phone,
  Mail,
  Award,
  Calendar,
  X,
  ChevronDown,
} from 'lucide-react';
import { Modal } from 'react-bootstrap';

const TYPES_LIST = [
  { key: 'all', label: 'All Professionals' },
  { key: 'architect', label: 'Architects' },
  { key: 'engineer', label: 'Engineers' },
  { key: 'contractor', label: 'Contractors (COW)' },
  { key: 'structural_engineer', label: 'Structural Eng (STR)' },
  { key: 'sor', label: 'SOR Officers' },
  { key: 'developer', label: 'Developers' },
];

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

const DataEntryPage = () => {
  const { showAlert, showConfirm } = useModal();
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    type: 'architect',
    name: '',
    licenseNo: '',
    licenseIssueDate: new Date().toISOString().split('T')[0],
    licenseExpiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    phone: '',
    email: '',
    status: 'active',
  });

  const [importFile, setImportFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      let endpoint = '/professionals';
      if (selectedType !== 'all') endpoint += `?type=${selectedType}`;
      const res = await fetchAPI(endpoint);
      if (res.success) setProfessionals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedType]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      type: selectedType === 'all' ? 'architect' : selectedType,
      name: '',
      licenseNo: '',
      licenseIssueDate: new Date().toISOString().split('T')[0],
      licenseExpiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      phone: '',
      email: '',
      status: 'active',
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      type: item.type,
      name: item.name,
      licenseNo: item.licenseNo,
      licenseIssueDate: item.licenseIssueDate
        ? new Date(item.licenseIssueDate).toISOString().split('T')[0]
        : '',
      licenseExpiryDate: item.licenseExpiryDate
        ? new Date(item.licenseExpiryDate).toISOString().split('T')[0]
        : '',
      phone: item.phone,
      email: item.email,
      status: item.status,
    });
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await fetchAPI(`/professionals/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        showAlert({ title: 'Record Updated', message: 'Professional record updated successfully.', type: 'success' });
      } else {
        await fetchAPI('/professionals', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        showAlert({ title: 'Record Created', message: 'New professional master registered successfully.', type: 'success' });
      }
      setShowFormModal(false);
      loadData();
    } catch (err) {
      showAlert({ title: 'Save Failed', message: err.message, type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete Professional',
      message: 'Are you sure you want to delete this professional master record? This action cannot be undone.',
      type: 'error',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;
    try {
      await fetchAPI(`/professionals/${id}`, { method: 'DELETE' });
      showAlert({ title: 'Deleted', message: 'Professional record deleted.', type: 'info' });
      loadData();
    } catch (err) {
      showAlert({ title: 'Delete Error', message: err.message, type: 'error' });
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append('file', importFile);
      await fetchAPI('/professionals/bulk-import', {
        method: 'POST',
        body: data,
      });
      setShowImportModal(false);
      setImportFile(null);
      loadData();
      showAlert({ title: 'Import Successful', message: 'Bulk import of professional records completed successfully!', type: 'success' });
    } catch (err) {
      showAlert({ title: 'Import Failed', message: err.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const filteredProfessionals = professionals.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.licenseNo.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.phone.includes(q)
    );
  });

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Professional Masters"
        subtitle="Registry of Architects, Engineers, Contractors, and Developers"
        icon={Users}
      >
        <PrismButton
          variant="secondary"
          icon={Upload}
          onClick={() => setShowImportModal(true)}
        >
          Bulk Import
        </PrismButton>
        <PrismButton
          variant="primary"
          icon={UserPlus}
          onClick={handleOpenAdd}
        >
          Add Professional
        </PrismButton>
      </PageHeader>

      {/* Mobile & Tablet Dropdown Select (< 992px) */}
      <div className="d-lg-none" style={{ marginBottom: '1.25rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.72rem',
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.35rem',
          }}
        >
          Select Professional Category
        </label>
        <div style={{ position: 'relative' }}>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{
              width: '100%',
              height: '42px',
              background: '#fff',
              border: '1.5px solid var(--accent-primary)',
              borderRadius: '10px',
              padding: '0 2.2rem 0 0.95rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: 'var(--accent-primary)',
              boxShadow: '0 2px 8px rgba(79,110,247,0.08)',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
            }}
          >
            {TYPES_LIST.map((t) => (
              <option key={t.key} value={t.key} style={{ color: '#0f172a', fontWeight: 600 }}>
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--accent-primary)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Desktop & Laptop Tabs Row (>= 992px) */}
      <div className="scroll-tabs-bar d-none d-lg-flex">
        {TYPES_LIST.map((t) => {
          const isActive = selectedType === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setSelectedType(t.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'var(--accent-primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1.25rem', maxWidth: '420px', position: 'relative' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Search by name, license #, email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ ...inpStyle, paddingLeft: '36px' }}
          onFocus={onF}
          onBlur={onB}
        />
      </div>

      {/* Content View */}
      {loading ? (
        <LoadingGlass message="Loading Master Records..." />
      ) : filteredProfessionals.length === 0 ? (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: '0 2px 12px rgba(15,23,42,0.05)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <Users size={26} color="#94a3b8" />
          </div>
          <h3
            style={{
              fontWeight: 700,
              fontSize: '1.1rem',
              color: 'var(--text-primary)',
              margin: '0 0 0.5rem',
            }}
          >
            No Professional Records Found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Click 'Add Professional' or 'Bulk Import' to populate master data.
          </p>
        </div>
      ) : (
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
                  {['Category', 'Name', 'License No', 'Issue Date', 'Expiry Date', 'Contact Info', 'Status', ''].map(
                    (h) => (
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
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredProfessionals.map((item, idx) => {
                  const isExpiringSoon =
                    item.licenseExpiryDate &&
                    new Date(item.licenseExpiryDate) <= new Date(Date.now() + 30 * 86400000);

                  return (
                    <tr
                      key={item._id}
                      style={{
                        borderBottom:
                          idx < filteredProfessionals.length - 1 ? '1px solid #f1f5f9' : 'none',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            background: '#eff1fe',
                            border: '1px solid #c7d2fe',
                            color: 'var(--accent-primary)',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            padding: '3px 8px',
                          }}
                        >
                          {item.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.845rem', color: 'var(--text-secondary)' }}>
                        {item.licenseNo}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {formatDate(item.licenseIssueDate)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem' }}>
                        <span style={{ color: isExpiringSoon ? '#ef4444' : 'var(--text-secondary)', fontWeight: isExpiringSoon ? 700 : 500 }}>
                          {formatDate(item.licenseExpiryDate)}
                        </span>
                        {isExpiringSoon && (
                          <ShieldAlert
                            size={14}
                            color="#ef4444"
                            style={{ marginLeft: 4, verticalAlign: 'middle' }}
                            title="Expiring within 30 days"
                          />
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.phone}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.email}</div>
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
                            background: item.status === 'active' ? '#ecfdf5' : '#f1f5f9',
                            color: item.status === 'active' ? '#10b981' : '#94a3b8',
                            border: `1px solid ${item.status === 'active' ? '#a7f3d0' : '#e2e8f0'}`,
                            textTransform: 'capitalize',
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: item.status === 'active' ? '#10b981' : '#94a3b8',
                            }}
                          />
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <PrismButton
                            variant="icon"
                            size="sm"
                            icon={Edit3}
                            title="Edit"
                            onClick={() => handleOpenEdit(item)}
                          />
                          <PrismButton
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            title="Delete"
                            onClick={() => handleDelete(item._id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="cards-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredProfessionals.map((item) => {
              const isExpiringSoon =
                item.licenseExpiryDate &&
                new Date(item.licenseExpiryDate) <= new Date(Date.now() + 30 * 86400000);

              return (
                <div
                  key={item._id}
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
                      {item.type.replace(/_/g, ' ')}
                    </span>
                    <span
                      style={{
                        borderRadius: '99px',
                        padding: '2px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: item.status === 'active' ? '#ecfdf5' : '#f1f5f9',
                        color: item.status === 'active' ? '#10b981' : '#94a3b8',
                      }}
                    >
                      {item.status}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: 'var(--text-primary)',
                      margin: '0 0 0.4rem',
                    }}
                  >
                    {item.name}
                  </h3>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    <Award size={13} style={{ marginRight: 4, verticalAlign: 'middle', color: '#f59e0b' }} />
                    License: <strong>{item.licenseNo}</strong>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    <Calendar size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    Expiry: {formatDate(item.licenseExpiryDate)}
                    {isExpiringSoon && <ShieldAlert size={13} color="#ef4444" style={{ marginLeft: 4 }} />}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                    <Phone size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {item.phone} · <Mail size={13} style={{ margin: '0 4px', verticalAlign: 'middle' }} /> {item.email}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '0.5rem',
                      paddingTop: '0.6rem',
                      borderTop: '1px solid #f1f5f9',
                    }}
                  >
                    <button
                      onClick={() => handleOpenEdit(item)}
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
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#ef4444',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showFormModal} onHide={() => setShowFormModal(false)} centered>
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
              {editingId ? 'Edit Professional Record' : 'Add Professional Master'}
            </h3>
            <button
              onClick={() => setShowFormModal(false)}
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
          <form onSubmit={handleFormSubmit}>
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
                  Professional Category
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{ ...inpStyle, cursor: 'pointer' }}
                  onFocus={onF}
                  onBlur={onB}
                  required
                >
                  <option value="architect">Architect</option>
                  <option value="engineer">Engineer</option>
                  <option value="contractor">Contractor (COW)</option>
                  <option value="structural_engineer">Structural Engineer (STR)</option>
                  <option value="sor">SOR Officer</option>
                  <option value="developer">Developer</option>
                </select>
              </div>

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
                  Full Name / Firm Name
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
                    License Number
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNo}
                    onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                    style={inpStyle}
                    onFocus={onF}
                    onBlur={onB}
                    required
                  />
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
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ ...inpStyle, cursor: 'pointer' }}
                    onFocus={onF}
                    onBlur={onB}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

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
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={formData.licenseIssueDate}
                    onChange={(e) => setFormData({ ...formData, licenseIssueDate: e.target.value })}
                    style={inpStyle}
                    onFocus={onF}
                    onBlur={onB}
                    required
                  />
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
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.licenseExpiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, licenseExpiryDate: e.target.value })
                    }
                    style={inpStyle}
                    onFocus={onF}
                    onBlur={onB}
                    required
                  />
                </div>
              </div>

              <div className="row g-2">
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
                    required
                  />
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
              </div>
            </div>

            <div className="form-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowFormModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="prism-btn prism-btn-primary prism-btn-md"
              >
                Save Record
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal show={showImportModal} onHide={() => setShowImportModal(false)} centered>
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
            <h3
              style={{
                fontWeight: 700,
                fontSize: '1.05rem',
                color: 'var(--text-primary)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FileSpreadsheet size={20} color="#16a34a" /> Bulk Import via Excel/CSV
            </h3>
            <button
              onClick={() => setShowImportModal(false)}
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
          <form onSubmit={handleImportSubmit}>
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  margin: '0 0 1rem',
                  lineHeight: 1.5,
                }}
              >
                Upload an Excel (.xlsx, .xls) or CSV file containing professional records. Expected
                column headers:{' '}
                <code
                  style={{
                    background: '#f1f5f9',
                    padding: '2px 5px',
                    borderRadius: '4px',
                    color: 'var(--accent-primary)',
                  }}
                >
                  Type, Name, LicenseNo, Phone, Email, IssueDate, ExpiryDate
                </code>
                .
              </p>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => setImportFile(e.target.files[0])}
                required
                style={{
                  ...inpStyle,
                  height: 'auto',
                  padding: '0.5rem 0.8rem',
                }}
              />
            </div>
            <div className="form-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowImportModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="prism-btn prism-btn-primary prism-btn-md"
              >
                {uploading ? 'Processing File...' : 'Upload & Import'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default DataEntryPage;
