import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StateSelect, CitySelect } from '../../components/StateCitySelect';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    businessName: '',
    state: 'Maharashtra',
    stateCode: '27',
    city: 'Pune',
    gstin: '',
    currency: 'INR',
    currencySymbol: '₹'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await register(formData);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-2 p-sm-3">
      <div className="card-zenith p-3 p-sm-4 p-md-5 my-3 shadow-lg" style={{ maxWidth: '560px', width: '100%', borderRadius: '16px' }}>
        <div className="text-center mb-4">
          <img
            src="/logo-blue.svg"
            alt="TheBox Logo"
            className="mb-2"
            style={{ height: '44px', maxWidth: '180px', objectFit: 'contain' }}
          />
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>Create New Business</h4>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section 1: Business Identity */}
          <div className="card p-3 mb-3 border bg-white rounded-3 shadow-none">
            <div className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
              1. Business Organization Identity
            </div>
            <div className="row g-2">
              <div className="col-12">
                <label className="form-label small fw-bold mb-1">Business / Trade Name*</label>
                <input
                  type="text"
                  name="businessName"
                  className="form-control form-control-sm fw-semibold"
                  placeholder="e.g. Shree Ganesh Enterprises"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-6">
                <StateSelect
                  label="State"
                  size="sm"
                  required
                  value={formData.state}
                  onChange={(state, stateCode) => setFormData(prev => ({ ...prev, state, stateCode }))}
                />
              </div>
              <div className="col-6">
                <CitySelect
                  label="City"
                  size="sm"
                  stateName={formData.state}
                  value={formData.city}
                  onChange={(city) => setFormData(prev => ({ ...prev, city }))}
                />
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Currency</label>
                <select
                  name="currency"
                  className="form-select form-select-sm fw-semibold"
                  value={formData.currency}
                  onChange={(e) => {
                    const curr = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      currency: curr,
                      currencySymbol: curr === 'USD' ? '$' : '₹'
                    }));
                  }}
                >
                  <option value="INR">₹ INR (Rupees)</option>
                  <option value="USD">$ USD (Dollar)</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>GSTIN (Optional)</label>
                <input
                  type="text"
                  name="gstin"
                  className="form-control form-control-sm font-mono text-uppercase"
                  placeholder="27AAAAA0000A1Z5"
                  value={formData.gstin}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Account Administrator */}
          <div className="card p-3 mb-3 border bg-white rounded-3 shadow-none">
            <div className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
              2. Owner / Admin Credentials
            </div>
            <div className="row g-2">
              <div className="col-6">
                <label className="form-label small fw-bold mb-1">Your Full Name*</label>
                <input
                  type="text"
                  name="name"
                  className="form-control form-control-sm"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>Mobile Number</label>
                <input
                  type="tel"
                  name="mobile"
                  className="form-control form-control-sm font-mono"
                  placeholder="10-digit mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-bold mb-1">Email Address*</label>
                <input
                  type="email"
                  name="email"
                  className="form-control form-control-sm"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-bold mb-1">Password*</label>
                <div className="position-relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="form-control form-control-sm pe-5"
                    placeholder="Create secure password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-muted position-absolute end-0 top-0 text-decoration-none p-1 me-1"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary-zenith w-100 justify-content-center py-2 mb-3 fw-bold shadow-sm text-nowrap"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span> Creating Business Workspace...
              </>
            ) : (
              <>
                <i className="bi bi-rocket-takeoff-fill me-1"></i> Register & Launch TheBox
              </>
            )}
          </button>

          <div className="text-center small text-muted">
            Already have an account?{' '}
            <NavLink to="/login" className="fw-bold text-primary text-decoration-none">
              Sign In
            </NavLink>
          </div>
        </form>
      </div>
    </div>
  );
};
