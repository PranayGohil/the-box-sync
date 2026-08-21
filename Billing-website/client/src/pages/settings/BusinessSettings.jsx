import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const BusinessSettings = () => {
  const { refreshProfile } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    gstin: '',
    pan: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    upiId: '',
    bankDetails: {
      bankName: '',
      accountNo: '',
      ifsc: '',
      branch: ''
    },
    settings: {
      dcStockPolicy: 'DEDUCT',
      invoiceTemplate: 'modern',
      termsAndConditions: ''
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setFetching(true);
      try {
        const res = await api.get('/businesses/profile');
        if (res.data.success) {
          const biz = res.data.data.business;
          setFormData({
            name: biz.name || '',
            legalName: biz.legalName || '',
            gstin: biz.gstin || '',
            pan: biz.pan || '',
            phone: biz.phone || '',
            email: biz.email || '',
            address: biz.address || '',
            city: biz.city || '',
            state: biz.state || '',
            pincode: biz.pincode || '',
            upiId: biz.upiId || '',
            bankDetails: biz.bankDetails || { bankName: '', accountNo: '', ifsc: '', branch: '' },
            settings: biz.settings || { dcStockPolicy: 'DEDUCT', invoiceTemplate: 'modern', termsAndConditions: '' }
          });
        }
      } catch (err) {
        console.error(err);
        addToast('Failed to load business profile', 'error');
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/businesses/profile', formData);
      if (res.data.success) {
        addToast('Business profile and invoice preferences saved successfully!', 'success');
        refreshProfile();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="business-settings-page-container">
      {/* 1. Header with Responsive Action Button */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>
            Organization Profile & Billing Settings
          </h4>
          <p className="text-muted small mb-0">
            Configure business identity, GSTIN, bank details for invoice QR codes, and default print formats
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-sm-auto justify-content-start justify-content-sm-end">
          <button
            type="submit"
            form="business-settings-form"
            className="btn btn-primary-zenith btn-sm flex-fill flex-sm-grow-0 d-flex align-items-center justify-content-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status"></span> Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle"></i> Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <i className="bi bi-building-check"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>GSTIN IDENTITY</div>
              <div className="fw-bold font-mono text-truncate text-success" style={{ fontSize: '0.95rem' }}>
                {formData.gstin ? 'VERIFIED B2B' : 'UNREGISTERED'}
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
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>BANK ACCOUNT</div>
              <div className="fw-bold font-mono text-truncate text-primary" style={{ fontSize: '0.95rem' }}>
                {formData.bankDetails?.bankName || 'NOT CONFIGURED'}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
              <i className="bi bi-qr-code"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>UPI QR INVOICING</div>
              <div className="fw-bold font-mono text-truncate text-warning-emphasis" style={{ fontSize: '0.95rem' }}>
                {formData.upiId ? 'ACTIVE' : 'NO UPI ID'}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="metric-tile">
            <div className="metric-tile-icon" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <i className="bi bi-printer"></i>
            </div>
            <div className="overflow-hidden">
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>PRINT TEMPLATE</div>
              <div className="fw-bold font-mono text-truncate text-capitalize" style={{ fontSize: '0.95rem' }}>
                {formData.settings?.invoiceTemplate || 'Modern'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {fetching ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <div className="small text-muted mt-2">Loading business profile...</div>
        </div>
      ) : (
        <form id="business-settings-form" onSubmit={handleSubmit}>
          {/* Section 1: General Information */}
          <div className="card-zenith p-3 p-sm-4 mb-4">
            <h6 className="fw-bold text-primary mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-building"></i> General Entity Information
            </h6>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label">Trade / Display Name*</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Brand / Shop Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Legal Name (As registered with GST)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Official entity name"
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                />
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label">GSTIN*</label>
                <input
                  type="text"
                  className="form-control font-mono fw-bold text-primary"
                  placeholder="27AAAAA1111A1Z1"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  required
                />
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label">PAN Number</label>
                <input
                  type="text"
                  className="form-control font-mono"
                  placeholder="AAAAA1111A"
                  value={formData.pan}
                  onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label">UPI ID (For Invoice Payment QR)</label>
                <input
                  type="text"
                  className="form-control font-mono text-success fw-bold"
                  placeholder="e.g. yourname@hdfcbank"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                />
              </div>
              <div className="col-6">
                <label className="form-label">Official Phone</label>
                <input
                  type="tel"
                  className="form-control font-mono"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="col-6">
                <label className="form-label">Official Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="billing@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Address Details */}
          <div className="card-zenith p-3 p-sm-4 mb-4">
            <h6 className="fw-bold text-primary mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-geo-alt"></i> Registered Business Address
            </h6>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Premises / Street Address</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Plot/Shop No, Industrial Estate, Locality"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="col-4">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Pune"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="col-4">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Maharashtra"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div className="col-4">
                <label className="form-label">Pincode</label>
                <input
                  type="text"
                  className="form-control font-mono"
                  placeholder="411001"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Bank Account for Invoices */}
          <div className="card-zenith p-3 p-sm-4 mb-4">
            <h6 className="fw-bold text-primary mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-bank"></i> Bank Settlement Details (Printed on Invoices)
            </h6>
            <div className="row g-3">
              <div className="col-6 col-md-3">
                <label className="form-label">Bank Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. HDFC Bank Ltd"
                  value={formData.bankDetails?.bankName || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                    })
                  }
                />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label">Account Number</label>
                <input
                  type="text"
                  className="form-control font-mono fw-bold"
                  placeholder="50200000000000"
                  value={formData.bankDetails?.accountNo || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, accountNo: e.target.value }
                    })
                  }
                />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label">IFSC Code</label>
                <input
                  type="text"
                  className="form-control font-mono"
                  placeholder="HDFC0001234"
                  value={formData.bankDetails?.ifsc || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, ifsc: e.target.value }
                    })
                  }
                />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label">Branch Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Shivaji Nagar Branch"
                  value={formData.bankDetails?.branch || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, branch: e.target.value }
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 4: Billing & Print Settings */}
          <div className="card-zenith p-3 p-sm-4 mb-4">
            <h6 className="fw-bold text-primary mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-printer"></i> Billing & Print Configurations
            </h6>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label">Default Invoice Print Template</label>
                <select
                  className="form-select fw-semibold"
                  value={formData.settings?.invoiceTemplate || 'modern'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: { ...formData.settings, invoiceTemplate: e.target.value }
                    })
                  }
                >
                  <option value="modern">Modern (Color Header & Accent)</option>
                  <option value="classic">Classic GST (Official Boxed)</option>
                  <option value="minimal">Minimalist Clean (Monochrome)</option>
                  <option value="professional">Corporate Professional</option>
                  <option value="thermal">Thermal Slip (80mm POS)</option>
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Delivery Challan Stock Policy</label>
                <select
                  className="form-select fw-semibold"
                  value={formData.settings?.dcStockPolicy || 'DEDUCT'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: { ...formData.settings, dcStockPolicy: e.target.value }
                    })
                  }
                >
                  <option value="DEDUCT">Deduct Stock Immediately on Challan</option>
                  <option value="RESERVE">Reserve Stock until Invoice is Made</option>
                  <option value="NONE">No Stock Change on Challan</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label">Default Terms & Conditions on Invoices</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="1. Goods once sold will not be taken back.&#10;2. Interest @ 18% p.a. will be charged after due date.&#10;3. Subject to local jurisdiction."
                  value={formData.settings?.termsAndConditions || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: { ...formData.settings, termsAndConditions: e.target.value }
                    })
                  }
                ></textarea>
              </div>
            </div>
          </div>

          {/* Save Action Footer */}
          <div className="d-flex justify-content-end mb-5">
            <button
              type="submit"
              className="btn btn-primary-zenith py-2 px-4 fw-bold w-100 w-sm-auto"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span> Saving Settings...
                </>
              ) : (
                'Save Business Settings'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
