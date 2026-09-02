import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/DataTable';
import { StateSelect, CitySelect } from '../../components/StateCitySelect';
import { INDIAN_STATES } from '../../data/indiaStatesAndCities';
import { ExportButtons } from '../../components/ExportButtons';

export const Suppliers = () => {
  const { addToast } = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    gstin: '',
    pan: '',
    creditDays: 45,
    address: {
      street: '',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '411001'
    }
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/suppliers?search=${encodeURIComponent(search)}`);
      if (res.data.success) setSuppliers(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load suppliers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      companyName: '',
      phone: '',
      email: '',
      gstin: '',
      pan: '',
      creditDays: 45,
      address: {
        street: 'Industrial Area',
        city: 'Pune',
        state: 'Maharashtra',
        stateCode: '27',
        pincode: '411001'
      }
    });
    setShowModal(true);
  };

  const handleOpenEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      companyName: supplier.companyName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      gstin: supplier.gstin || '',
      pan: supplier.pan || '',
      creditDays: supplier.creditDays || 45,
      address: supplier.address || { street: '', city: '', state: 'Maharashtra', stateCode: '27', pincode: '' }
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        const res = await api.put(`/suppliers/${editingSupplier._id}`, formData);
        if (res.data.success) {
          addToast('Supplier details updated successfully!', 'success');
          setShowModal(false);
          fetchSuppliers();
        }
      } else {
        const res = await api.post('/suppliers', formData);
        if (res.data.success) {
          addToast('Supplier registered successfully!', 'success');
          setShowModal(false);
          fetchSuppliers();
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save supplier', 'error');
    }
  };

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Filtered Suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesState = !stateFilter || s.address?.state === stateFilter;
    let matchesBalance = true;
    if (balanceFilter === 'due') {
      matchesBalance = (s.currentBalance || 0) > 0;
    } else if (balanceFilter === 'zero') {
      matchesBalance = (s.currentBalance || 0) <= 0;
    }
    return matchesBalance && matchesState;
  });

  // Top Metrics Calculation
  const totalSuppliersCount = suppliers.length;
  const totalPayables = suppliers.reduce((sum, s) => sum + (s.currentBalance > 0 ? s.currentBalance : 0), 0);
  const gstinCount = suppliers.filter((s) => s.gstin).length;
  const settledCount = suppliers.filter((s) => (s.currentBalance || 0) <= 0).length;

  const columns = [
    {
      header: 'Supplier & Company',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="fw-bold text-dark">{row.name}</div>
          {row.companyName && (
            <div className="small text-muted font-mono" style={{ fontSize: '0.75rem' }}>
              {row.companyName}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Contact Info',
      accessor: 'phone',
      render: (row) => (
        <div className="small">
          <div>
            <i className="bi bi-telephone text-muted me-1"></i>
            <a href={`tel:${row.phone}`} className="text-dark text-decoration-none font-mono">
              {row.phone || '-'}
            </a>
          </div>
          {row.email && (
            <div className="text-muted text-truncate" style={{ maxWidth: '180px' }}>
              <i className="bi bi-envelope text-muted me-1"></i>
              <a href={`mailto:${row.email}`} className="text-muted text-decoration-none">
                {row.email}
              </a>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'GSTIN / Location',
      accessor: 'gstin',
      render: (row) => (
        <div>
          {row.gstin ? (
            <span className="font-mono badge bg-light text-dark border">{row.gstin}</span>
          ) : (
            <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.68rem' }}>
              UNREGISTERED
            </span>
          )}
          <div className="small text-muted mt-1">
            <i className="bi bi-geo-alt me-1 text-secondary"></i>
            {row.address?.city ? `${row.address.city}, ` : ''}{row.address?.state || 'Maharashtra'}
          </div>
        </div>
      )
    },
    {
      header: 'Credit Days',
      accessor: 'creditDays',
      align: 'center',
      render: (row) => (
        <span className="badge bg-light text-dark border font-mono">
          {row.creditDays || 30} Days
        </span>
      )
    },
    {
      header: 'Accounts Payable (₹)',
      accessor: 'currentBalance',
      align: 'right',
      render: (row) => (
        <span className={`fw-bold font-mono ${row.currentBalance > 0 ? 'text-danger' : 'text-success'}`}>
          ₹{fmt(row.currentBalance)}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <button
          className="btn btn-sm btn-outline-secondary py-1 px-2"
          title="Edit Supplier"
          onClick={() => handleOpenEdit(row)}
        >
          <i className="bi bi-pencil"></i>
        </button>
      )
    }
  ];

  return (
    <div className="suppliers-page-container">
      {/* 1. Header with Responsive Action Button */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Suppliers CRM & Accounts Payable
          </h4>
          <p className="text-muted small mb-0">
            Vendor relationship directory, GSTIN verification, credit payment terms, and payable balances
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end align-items-center flex-wrap">
          <ExportButtons
            filename="Suppliers_Directory"
            title="Suppliers & Accounts Payable Directory"
            headers={['Supplier Name', 'Company Name', 'Mobile', 'Email', 'GSTIN', 'PAN', 'State', 'City', 'Credit Days', 'Payable Balance (Rs)']}
            data={filteredSuppliers.map((s) => [
              s.name,
              s.companyName || '-',
              s.phone || '-',
              s.email || '-',
              s.gstin || '-',
              s.pan || '-',
              s.address?.state || '-',
              s.address?.city || '-',
              s.creditDays || 0,
              s.currentBalance || 0
            ])}
          />
          <button className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0 text-nowrap" onClick={handleOpenAdd}>
            <i className="bi bi-person-plus-fill me-1"></i> Add New Supplier
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <i className="bi bi-building"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL SUPPLIERS</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {totalSuppliersCount} Vendors
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

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <i className="bi bi-shield-check"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>GST REGISTERED</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                {gstinCount} Vendors
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <i className="bi bi-check2-circle"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>SETTLED VENDORS</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                {settledCount} Accounts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="card-zenith p-3 mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="position-relative">
              <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '10px' }}></i>
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Search suppliers by name, company, phone, GSTIN..."
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
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <option value="">All States / UTs</option>
              {INDIAN_STATES.map((s) => (
                <option key={s.code} value={s.name}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm fw-semibold"
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
            >
              <option value="">All Balances</option>
              <option value="due">Accounts Payable Due (&gt; ₹0)</option>
              <option value="zero">Settled Balances (₹0)</option>
            </select>
          </div>

          <div className="col-12 col-md-1">
            <button
              className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center"
              onClick={fetchSuppliers}
              title="Refresh Suppliers"
            >
              <i className="bi bi-arrow-clockwise"></i> <span className="d-md-none ms-1">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Desktop & Tablet View (DataTable, hidden on mobile <768px) */}
      <div className="card-zenith d-none d-md-block">
        <DataTable
          columns={columns}
          data={filteredSuppliers}
          loading={loading}
          emptyMessage="No suppliers found"
          emptyIcon="bi-building"
        />
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="card-zenith p-4 text-center text-muted">
            <i className="bi bi-building fs-1 d-block mb-2 text-secondary opacity-50"></i>
            <div className="fw-bold">No Suppliers Found</div>
            <div className="small">Click "Add New Supplier" to add your first vendor.</div>
          </div>
        ) : (
          filteredSuppliers.map((sup) => {
            const hasDue = (sup.currentBalance || 0) > 0;

            return (
              <div key={sup._id} className="invoice-card-mobile">
                {/* Header */}
                <div className="invoice-card-mobile-header">
                  <div className="fw-bold text-dark fs-6 text-truncate" style={{ maxWidth: '65%' }}>
                    {sup.name}
                  </div>
                  <div className={`fw-extrabold font-mono fs-6 ${hasDue ? 'text-danger' : 'text-success'}`}>
                    ₹{fmt(sup.currentBalance)}
                  </div>
                </div>

                {/* Company & GST */}
                <div className="mb-2">
                  {sup.companyName && (
                    <div className="small text-dark fw-semibold">{sup.companyName}</div>
                  )}
                  <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                    {sup.gstin ? (
                      <span className="badge bg-light text-dark border font-mono" style={{ fontSize: '0.68rem' }}>
                        GSTIN: {sup.gstin}
                      </span>
                    ) : (
                      <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.68rem' }}>
                        UNREGISTERED
                      </span>
                    )}
                    {sup.phone && (
                      <span className="small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                        <i className="bi bi-telephone me-1"></i>{sup.phone}
                      </span>
                    )}
                    {(sup.address?.city || sup.address?.state) && (
                      <span className="small text-muted" style={{ fontSize: '0.72rem' }}>
                        <i className="bi bi-geo-alt me-1"></i>
                        {sup.address?.city ? `${sup.address.city}, ` : ''}{sup.address?.state}
                      </span>
                    )}
                  </div>
                </div>

                {/* Credit info strip */}
                {sup.creditDays > 0 && (
                  <div className="d-flex justify-content-between font-mono small text-muted py-1 px-2 mb-2 bg-light rounded border" style={{ fontSize: '0.72rem' }}>
                    <span>Payment Terms:</span>
                    <strong className="text-dark">{sup.creditDays} Days</strong>
                  </div>
                )}

                {/* Mobile Actions */}
                <div className="invoice-card-mobile-actions">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm flex-fill py-1 d-flex align-items-center justify-content-center gap-1"
                    style={{ fontSize: '0.78rem' }}
                    onClick={() => handleOpenEdit(sup)}
                  >
                    <i className="bi bi-pencil"></i> Edit Supplier
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Supplier Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content" style={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' }}>
              <div className="modal-header bg-light px-3 px-sm-4 py-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-building text-primary me-2"></i>
                  {editingSupplier ? 'Edit Supplier Details' : 'Add New Supplier Profile'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-3 p-sm-4" style={{ background: '#f8fafc', maxHeight: 'calc(80vh - 120px)' }}>
                  <div className="card p-3 mb-3 border bg-white rounded-3 shadow-none">
                    <div className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                      1. Basic Identification & Contact
                    </div>
                    <div className="row g-2 g-sm-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold mb-1">Contact Person Name*</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Ramesh Patel"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold mb-1">Company / Entity Name</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Sony Distributorship Pvt Ltd"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        />
                      </div>
                      <div className="col-6 col-md-4">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Phone Number</label>
                        <input
                          type="tel"
                          className="form-control form-control-sm font-mono"
                          placeholder="10-digit phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div className="col-6 col-md-4">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Email Address</label>
                        <input
                          type="email"
                          className="form-control form-control-sm"
                          placeholder="orders@supplier.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Credit Days (Payment Terms)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm font-mono"
                          value={formData.creditDays}
                          onChange={(e) => setFormData({ ...formData, creditDays: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="card p-3 mb-3 border bg-white rounded-3 shadow-none">
                    <div className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                      2. GST Compliance & Tax Identifiers
                    </div>
                    <div className="row g-2 g-sm-3">
                      <div className="col-6">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>GSTIN</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-mono text-uppercase"
                          placeholder="27AAAAA1111A1Z1"
                          value={formData.gstin}
                          onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>PAN Number</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-mono text-uppercase"
                          placeholder="AAAAA1111A"
                          value={formData.pan}
                          onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="card p-3 border bg-white rounded-3 shadow-none">
                    <div className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                      3. Supplier Office & Dispatch Address
                    </div>
                    <div className="row g-2">
                      <div className="col-12">
                        <label className="form-label small mb-1 fw-semibold" style={{ fontSize: '0.75rem' }}>Premises / Street Address</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Premises, street, locality"
                          value={formData.address?.street || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: { ...formData.address, street: e.target.value }
                            })
                          }
                        />
                      </div>
                      <div className="col-12 col-md-5">
                        <StateSelect
                          label="State"
                          required
                          size="sm"
                          value={formData.address?.state}
                          onChange={(state, stateCode) =>
                            setFormData({
                              ...formData,
                              address: {
                                ...formData.address,
                                state,
                                stateCode
                              }
                            })
                          }
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <CitySelect
                          label="City"
                          size="sm"
                          stateName={formData.address?.state}
                          value={formData.address?.city}
                          onChange={(city) =>
                            setFormData({
                              ...formData,
                              address: {
                                ...formData.address,
                                city
                              }
                            })
                          }
                        />
                      </div>
                      <div className="col-12 col-md-3">
                        <label className="form-label small mb-1 fw-semibold" style={{ fontSize: '0.75rem' }}>Pincode</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-mono"
                          placeholder="Pincode"
                          value={formData.address?.pincode || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: { ...formData.address, pincode: e.target.value }
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-white d-flex flex-column-reverse flex-sm-row justify-content-end gap-2 p-3 border-top">
                  <button type="button" className="btn btn-outline-secondary btn-sm w-100 w-sm-auto text-nowrap" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-zenith btn-sm w-100 w-sm-auto text-nowrap fw-bold">
                    {editingSupplier ? 'Update Supplier' : 'Save Supplier Profile'}
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
