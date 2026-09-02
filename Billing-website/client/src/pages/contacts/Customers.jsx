import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { DataTable } from '../../components/DataTable';
import { StateSelect, CitySelect } from '../../components/StateCitySelect';
import { INDIAN_STATES } from '../../data/indiaStatesAndCities';
import { ExportButtons } from '../../components/ExportButtons';

export const Customers = () => {
  const { addToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [showStatementModal, setShowStatementModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    phone: '',
    email: '',
    gstin: '',
    pan: '',
    customerType: 'B2B',
    creditLimit: 0,
    creditDays: 0,
    billingAddress: {
      street: '',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '411001'
    }
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/customers?search=${encodeURIComponent(search)}`);
      if (res.data.success) setCustomers(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      businessName: '',
      phone: '',
      email: '',
      gstin: '',
      pan: '',
      customerType: 'B2B',
      creditLimit: 0,
      creditDays: 0,
      billingAddress: {
        street: 'Main Road',
        city: 'Pune',
        state: 'Maharashtra',
        stateCode: '27',
        pincode: '411001'
      }
    });
    setShowModal(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      businessName: customer.businessName || '',
      phone: customer.phone || '',
      email: customer.email || '',
      gstin: customer.gstin || '',
      pan: customer.pan || '',
      customerType: customer.customerType || 'B2B',
      creditLimit: customer.creditLimit !== undefined && customer.creditLimit !== null ? customer.creditLimit : 0,
      creditDays: customer.creditDays !== undefined && customer.creditDays !== null ? customer.creditDays : 0,
      billingAddress: customer.billingAddress || { street: '', city: '', state: 'Maharashtra', stateCode: '27', pincode: '' }
    });
    setShowModal(true);
  };

  const handleViewStatement = async (customerId) => {
    try {
      const res = await api.get(`/customers/${customerId}`);
      if (res.data.success) {
        setSelectedStatement(res.data.data);
        setShowStatementModal(true);
      }
    } catch (err) {
      addToast('Failed to load customer statement', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        const res = await api.put(`/customers/${editingCustomer._id}`, formData);
        if (res.data.success) {
          addToast('Customer profile updated successfully!', 'success');
          setShowModal(false);
          fetchCustomers();
        }
      } else {
        const res = await api.post('/customers', formData);
        if (res.data.success) {
          addToast('Customer added successfully!', 'success');
          setShowModal(false);
          fetchCustomers();
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save customer', 'error');
    }
  };

  const fmt = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Filtered Customers
  const filteredCustomers = customers.filter((c) => {
    const matchesType = !typeFilter || c.customerType === typeFilter;
    const matchesState = !stateFilter || c.billingAddress?.state === stateFilter;
    let matchesBalance = true;
    if (balanceFilter === 'due') {
      matchesBalance = (c.currentBalance || 0) > 0;
    } else if (balanceFilter === 'zero') {
      matchesBalance = (c.currentBalance || 0) <= 0;
    }
    return matchesType && matchesBalance && matchesState;
  });

  // Top Metrics Calculation
  const totalCustomerCount = customers.length;
  const totalReceivables = customers.reduce((sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0), 0);
  const b2bCount = customers.filter((c) => c.customerType === 'B2B' || c.gstin).length;
  const zeroBalanceCount = customers.filter((c) => (c.currentBalance || 0) <= 0).length;

  const columns = [
    {
      header: 'Customer & Trade Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="fw-bold text-dark">{row.name}</div>
          {row.businessName && (
            <div className="small text-muted font-mono" style={{ fontSize: '0.75rem' }}>
              {row.businessName}
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
              UNREGISTERED / B2C
            </span>
          )}
          <div className="small text-muted mt-1">
            <i className="bi bi-geo-alt me-1 text-secondary"></i>
            {row.billingAddress?.city ? `${row.billingAddress.city}, ` : ''}{row.billingAddress?.state || 'Maharashtra'}
          </div>
        </div>
      )
    },
    {
      header: 'Credit Terms',
      accessor: 'creditLimit',
      align: 'center',
      render: (row) => (
        <div className="small">
          <span className="font-mono fw-semibold">₹{fmt(row.creditLimit)}</span>
          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{row.creditDays ?? 0} Days</div>
        </div>
      )
    },
    {
      header: 'Receivable Due (₹)',
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
        <div className="d-flex justify-content-end gap-1">
          <button
            className="btn btn-sm btn-outline-primary py-1 px-2"
            title="Customer Statement & Ledger"
            onClick={() => handleViewStatement(row._id)}
          >
            <i className="bi bi-journal-text"></i>
          </button>
          <button
            className="btn btn-sm btn-outline-secondary py-1 px-2"
            title="Edit Customer"
            onClick={() => handleOpenEdit(row)}
          >
            <i className="bi bi-pencil"></i>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="customers-page-container">
      {/* 1. Header with Responsive Action Button */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Customers CRM & Accounts Receivable
          </h4>
          <p className="text-muted small mb-0">
            Manage customer directories, GST tax profiles, credit limits, and individual ledger statements
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end align-items-center flex-wrap">
          <ExportButtons
            filename="Customers_Directory"
            title="Customers & Accounts Receivable Directory"
            headers={['Customer Name', 'Business / Trade Name', 'Mobile', 'Email', 'GSTIN', 'State', 'City', 'Credit Limit (Rs)', 'Credit Days', 'Balance Due (Rs)']}
            data={filteredCustomers.map((c) => [
              c.name,
              c.businessName || '-',
              c.phone || '-',
              c.email || '-',
              c.gstin || '-',
              c.billingAddress?.state || '-',
              c.billingAddress?.city || '-',
              c.creditLimit || 0,
              c.creditDays || 0,
              c.currentBalance || 0
            ])}
          />
          <button className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0 text-nowrap" onClick={handleOpenAdd}>
            <i className="bi bi-person-plus-fill me-1"></i> Add New Customer
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
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>TOTAL CUSTOMERS</div>
              <div className="fw-bold font-mono text-truncate" style={{ fontSize: '0.95rem' }}>
                {totalCustomerCount} Accounts
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
              <i className="bi bi-hourglass-split"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>RECEIVABLES DUE</div>
              <div className="fw-bold font-mono text-truncate text-danger" style={{ fontSize: '0.95rem' }}>
                ₹{fmt(totalReceivables)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <i className="bi bi-building-check"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>B2B GST REGISTERED</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                {b2bCount} Businesses
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
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>CLEAN BALANCES</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                {zeroBalanceCount} Settled
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="card-zenith p-3 mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <div className="position-relative">
              <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '10px' }}></i>
              <input
                type="text"
                className="form-control form-control-sm ps-5"
                placeholder="Search by customer name, phone, GSTIN..."
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

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm fw-semibold"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="B2B">B2B Registered</option>
              <option value="B2C">B2C Retail</option>
            </select>
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

          <div className="col-6 col-md-2">
            <select
              className="form-select form-select-sm fw-semibold"
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
            >
              <option value="">All Balances</option>
              <option value="due">Outstanding (&gt; ₹0)</option>
              <option value="zero">Settled (₹0)</option>
            </select>
          </div>

          <div className="col-6 col-md-1">
            <button
              className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center"
              onClick={fetchCustomers}
              title="Refresh Directory"
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
          data={filteredCustomers}
          loading={loading}
          emptyMessage="No customers found"
          emptyIcon="bi-people"
        />
      </div>

      {/* 5. Mobile Touch Card List (Visible on mobile <768px) */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="card-zenith p-4 text-center text-muted">
            <i className="bi bi-people fs-1 d-block mb-2 text-secondary opacity-50"></i>
            <div className="fw-bold">No Customers Found</div>
            <div className="small">Click "Add New Customer" to register your first contact.</div>
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const hasDue = (cust.currentBalance || 0) > 0;

            return (
              <div key={cust._id} className="invoice-card-mobile">
                {/* Header */}
                <div className="invoice-card-mobile-header">
                  <div className="fw-bold text-dark fs-6 text-truncate" style={{ maxWidth: '65%' }}>
                    {cust.name}
                  </div>
                  <div className={`fw-extrabold font-mono fs-6 ${hasDue ? 'text-danger' : 'text-success'}`}>
                    ₹{fmt(cust.currentBalance)}
                  </div>
                </div>

                {/* Business & GST */}
                <div className="mb-2">
                  {cust.businessName && (
                    <div className="small text-dark fw-semibold">{cust.businessName}</div>
                  )}
                  <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                    {cust.gstin ? (
                      <span className="badge bg-light text-dark border font-mono" style={{ fontSize: '0.68rem' }}>
                        GSTIN: {cust.gstin}
                      </span>
                    ) : (
                      <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.68rem' }}>
                        B2C
                      </span>
                    )}
                    {cust.phone && (
                      <span className="small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                        <i className="bi bi-telephone me-1"></i>{cust.phone}
                      </span>
                    )}
                    {(cust.billingAddress?.city || cust.billingAddress?.state) && (
                      <span className="small text-muted" style={{ fontSize: '0.72rem' }}>
                        <i className="bi bi-geo-alt me-1"></i>
                        {cust.billingAddress?.city ? `${cust.billingAddress.city}, ` : ''}{cust.billingAddress?.state}
                      </span>
                    )}
                  </div>
                </div>

                {/* Credit info strip */}
                {(cust.creditLimit > 0 || cust.creditDays > 0) && (
                  <div className="d-flex justify-content-between font-mono small text-muted py-1 px-2 mb-2 bg-light rounded border" style={{ fontSize: '0.72rem' }}>
                    <span>Credit Limit: <strong className="text-dark">₹{fmt(cust.creditLimit)}</strong></span>
                    <span>Terms: <strong className="text-dark">{cust.creditDays || 0} Days</strong></span>
                  </div>
                )}

                {/* Mobile Actions */}
                <div className="invoice-card-mobile-actions">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm flex-fill py-1 d-flex align-items-center justify-content-center gap-1"
                    style={{ fontSize: '0.78rem' }}
                    onClick={() => handleViewStatement(cust._id)}
                  >
                    <i className="bi bi-journal-text"></i> Ledger
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm flex-fill py-1 d-flex align-items-center justify-content-center gap-1"
                    style={{ fontSize: '0.78rem' }}
                    onClick={() => handleOpenEdit(cust)}
                  >
                    <i className="bi bi-pencil"></i> Edit
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content" style={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' }}>
              <div className="modal-header bg-light px-3 px-sm-4 py-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person-badge text-primary me-2"></i>
                  {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer Profile'}
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
                        <label className="form-label small fw-bold mb-1">Contact Person / Name*</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Rajesh Sharma"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold mb-1">Business / Trade Name</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Apex Technologies Pvt Ltd"
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        />
                      </div>
                      <div className="col-6 col-md-4">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Mobile Number</label>
                        <input
                          type="tel"
                          className="form-control form-control-sm font-mono"
                          placeholder="10-digit mobile"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div className="col-6 col-md-4">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Email Address</label>
                        <input
                          type="email"
                          className="form-control form-control-sm"
                          placeholder="billing@company.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Customer Type</label>
                        <select
                          className="form-select form-select-sm fw-semibold"
                          value={formData.customerType}
                          onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                        >
                          <option value="B2B">B2B (Registered Business)</option>
                          <option value="B2C">B2C (Retail Consumer)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="card p-3 mb-3 border bg-white rounded-3 shadow-none">
                    <div className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                      2. GST Compliance & Credit Terms
                    </div>
                    <div className="row g-2 g-sm-3">
                      <div className="col-6">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>GSTIN (if B2B)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-mono text-uppercase"
                          placeholder="27AAACA1234A1Z1"
                          value={formData.gstin}
                          onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>PAN Number</label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-mono text-uppercase"
                          placeholder="AAACA1234A"
                          value={formData.pan}
                          onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Credit Limit (₹)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm font-mono"
                          value={formData.creditLimit}
                          onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Credit Days (Payment Term)</label>
                        <input
                          type="number"
                          className="form-control form-control-sm font-mono"
                          value={formData.creditDays}
                          onChange={(e) => setFormData({ ...formData, creditDays: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="card p-3 border bg-white rounded-3 shadow-none">
                    <div className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                      3. Billing & Dispatch Address
                    </div>
                    <div className="row g-2">
                      <div className="col-12">
                        <label className="form-label small mb-1 fw-semibold" style={{ fontSize: '0.75rem' }}>Premises / Street Address</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Building, street, locality"
                          value={formData.billingAddress?.street || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              billingAddress: { ...formData.billingAddress, street: e.target.value }
                            })
                          }
                        />
                      </div>
                      <div className="col-12 col-md-5">
                        <StateSelect
                          label="State"
                          required
                          size="sm"
                          value={formData.billingAddress?.state}
                          onChange={(state, stateCode) =>
                            setFormData({
                              ...formData,
                              billingAddress: {
                                ...formData.billingAddress,
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
                          stateName={formData.billingAddress?.state}
                          value={formData.billingAddress?.city}
                          onChange={(city) =>
                            setFormData({
                              ...formData,
                              billingAddress: {
                                ...formData.billingAddress,
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
                          value={formData.billingAddress?.pincode || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              billingAddress: { ...formData.billingAddress, pincode: e.target.value }
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
                    {editingCustomer ? 'Update Customer' : 'Save Customer Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Ledger Statement Modal */}
      {showStatementModal && selectedStatement && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content" style={{ borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div className="modal-header bg-light" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <h5 className="modal-title fw-bold text-dark">
                    <i className="bi bi-journal-text text-primary me-2"></i>
                    {selectedStatement.customer?.name} - Customer Ledger
                  </h5>
                  <div className="small text-muted font-mono">
                    GSTIN: {selectedStatement.customer?.gstin || 'Unregistered / B2C'} | Phone: {selectedStatement.customer?.phone || 'N/A'}
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowStatementModal(false)}></button>
              </div>

              <div className="modal-body p-3 p-sm-4">
                {/* 4-Metric Summary Strip */}
                <div className="row g-2 mb-4">
                  <div className="col-6 col-md-3">
                    <div className="p-3 bg-light rounded border text-center">
                      <div className="small text-muted" style={{ fontSize: '0.75rem' }}>TOTAL INVOICED</div>
                      <div className="fw-bold fs-5 font-mono">{selectedStatement.invoices?.length || 0}</div>
                      <div className="small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                        ₹{fmt(selectedStatement.invoices?.reduce((sum, i) => sum + (i.grandTotal || 0), 0))}
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 bg-light rounded border text-center">
                      <div className="small text-muted" style={{ fontSize: '0.75rem' }}>PAYMENTS RECORDED</div>
                      <div className="fw-bold fs-5 text-success font-mono">{selectedStatement.payments?.length || 0}</div>
                      <div className="small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                        ₹{fmt(selectedStatement.payments?.reduce((sum, p) => sum + (p.amount || 0), 0))}
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 bg-light rounded border text-center">
                      <div className="small text-muted" style={{ fontSize: '0.75rem' }}>SALES RETURNS</div>
                      <div className="fw-bold fs-5 text-purple font-mono" style={{ color: '#6b21a8' }}>
                        {selectedStatement.salesReturns?.length || 0}
                      </div>
                      <div className="small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                        ₹{fmt(selectedStatement.salesReturns?.reduce((sum, r) => sum + (r.grandTotal || 0), 0))}
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 bg-light rounded border text-center">
                      <div className="small text-muted" style={{ fontSize: '0.75rem' }}>OUTSTANDING DUE</div>
                      <div className="fw-bold fs-5 text-danger font-mono">
                        ₹{fmt(selectedStatement.customer?.currentBalance)}
                      </div>
                      <div className="small text-muted font-mono" style={{ fontSize: '0.72rem' }}>
                        Limit: ₹{fmt(selectedStatement.customer?.creditLimit)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1. Invoice Billing History */}
                <h6 className="fw-bold small mb-2 text-dark d-flex align-items-center gap-1">
                  <i className="bi bi-receipt text-primary"></i> Invoice Billing History:
                </h6>
                <div className="table-responsive border rounded mb-4">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="bg-light">
                      <tr style={{ fontSize: '0.75rem' }}>
                        <th>Invoice #</th>
                        <th>Date</th>
                        <th className="text-end">Grand Total (₹)</th>
                        <th className="text-end">Paid (₹)</th>
                        <th className="text-end">Balance Due (₹)</th>
                        <th className="text-center">Doc Status</th>
                        <th className="text-center">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!selectedStatement.invoices || selectedStatement.invoices.length === 0) ? (
                        <tr>
                          <td colSpan="7" className="text-center text-muted py-3">No invoices billed yet</td>
                        </tr>
                      ) : (
                        selectedStatement.invoices.map((inv) => {
                          let docBadge = 'badge-finalized';
                          let docLabel = inv.status?.toUpperCase();
                          if (inv.status === 'cancelled') {
                            docBadge = 'badge-cancelled';
                          } else if (inv.status === 'returned') {
                            docBadge = 'badge-returned';
                            docLabel = 'RETURNED';
                          } else if (inv.status === 'partially_returned') {
                            docBadge = 'badge-partial-return';
                            docLabel = 'PARTIAL RETURN';
                          }

                          return (
                            <tr key={inv._id}>
                              <td className="fw-bold font-mono text-primary">#{inv.invoiceNo}</td>
                              <td>{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                              <td className="font-mono text-end">₹{fmt(inv.grandTotal)}</td>
                              <td className="font-mono text-end text-success">₹{fmt(inv.paidAmount)}</td>
                              <td className="font-mono text-end text-danger fw-bold">₹{fmt(inv.balanceAmount)}</td>
                              <td className="text-center">
                                <span className={`badge-status ${docBadge}`} style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                                  {docLabel}
                                </span>
                                {inv.returnedAmount > 0 && (
                                  <div className="text-danger font-mono" style={{ fontSize: '0.65rem' }}>
                                    Ret: ₹{fmt(inv.returnedAmount)}
                                  </div>
                                )}
                              </td>
                              <td className="text-center">
                                <span
                                  className={`badge-status ${
                                    inv.paymentStatus === 'paid'
                                      ? 'badge-paid'
                                      : inv.paymentStatus === 'partially_paid'
                                      ? 'badge-partial'
                                      : 'badge-unpaid'
                                  }`}
                                  style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
                                >
                                  {inv.paymentStatus?.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 2. Sales Returns History */}
                {selectedStatement.salesReturns && selectedStatement.salesReturns.length > 0 && (
                  <>
                    <h6 className="fw-bold small mb-2 text-dark d-flex align-items-center gap-1">
                      <i className="bi bi-arrow-counterclockwise text-danger"></i> Sales Returns & Credit Notes:
                    </h6>
                    <div className="table-responsive border rounded mb-4">
                      <table className="table table-sm align-middle mb-0">
                        <thead className="bg-light">
                          <tr style={{ fontSize: '0.75rem' }}>
                            <th>Return #</th>
                            <th>Date</th>
                            <th>Original Invoice</th>
                            <th className="text-end">Return Value (₹)</th>
                            <th>Reason</th>
                            <th className="text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedStatement.salesReturns.map((ret) => (
                            <tr key={ret._id}>
                              <td className="fw-bold font-mono text-purple" style={{ color: '#6b21a8' }}>
                                #{ret.returnNo}
                              </td>
                              <td>{new Date(ret.date).toLocaleDateString('en-IN')}</td>
                              <td className="font-mono text-primary small">
                                {ret.invoiceId?.invoiceNo ? `#${ret.invoiceId.invoiceNo}` : '-'}
                              </td>
                              <td className="font-mono text-end fw-bold text-danger">₹{fmt(ret.grandTotal)}</td>
                              <td className="small text-muted text-capitalize">{ret.reason?.replace('_', ' ')}</td>
                              <td className="text-center">
                                <span className="badge-status badge-returned" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                                  PROCESSED
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* 3. Payment Receipts */}
                <h6 className="fw-bold small mb-2 text-dark d-flex align-items-center gap-1">
                  <i className="bi bi-wallet2 text-success"></i> Payment Collection Receipts:
                </h6>
                <div className="table-responsive border rounded">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="bg-light">
                      <tr style={{ fontSize: '0.75rem' }}>
                        <th>Receipt #</th>
                        <th>Date</th>
                        <th className="text-end">Amount Collected (₹)</th>
                        <th>Payment Mode</th>
                        <th>Ref #</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!selectedStatement.payments || selectedStatement.payments.length === 0) ? (
                        <tr>
                          <td colSpan="5" className="text-center text-muted py-3">No payment receipts recorded yet</td>
                        </tr>
                      ) : (
                        selectedStatement.payments.map((pm) => (
                          <tr key={pm._id}>
                            <td className="fw-bold font-mono text-primary">#{pm.paymentNo}</td>
                            <td>{new Date(pm.date).toLocaleDateString('en-IN')}</td>
                            <td className="font-mono text-end fw-bold text-success">₹{fmt(pm.amount)}</td>
                            <td className="text-uppercase small">{pm.paymentMode}</td>
                            <td className="font-mono text-muted small">{pm.referenceNo || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
