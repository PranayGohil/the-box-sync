import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    businessName: '',
    state: 'Maharashtra',
    stateCode: '27',
    gstin: ''
  });
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
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-3">
      <div className="card-zenith p-4 p-md-5 my-4" style={{ maxWidth: '520px', width: '100%' }}>
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-3 mb-2"
            style={{ width: '50px', height: '50px', fontSize: '1.6rem' }}
          >
            <i className="bi bi-building"></i>
          </div>
          <h4 className="fw-bold mb-1">Create New Business</h4>
          <p className="text-muted small">Start invoicing with GST compliance in under 2 minutes</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-2 mb-3">
            <div className="col-12">
              <label className="form-label">Business / Shop Name*</label>
              <input
                type="text"
                name="businessName"
                className="form-control"
                placeholder="e.g. Shree Ganesh Enterprises"
                value={formData.businessName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-sm-6">
              <label className="form-label">State*</label>
              <select name="state" className="form-select" value={formData.state} onChange={handleChange}>
                <option value="Maharashtra">Maharashtra (27)</option>
                <option value="Gujarat">Gujarat (24)</option>
                <option value="Karnataka">Karnataka (29)</option>
                <option value="Delhi">Delhi (07)</option>
                <option value="Tamil Nadu">Tamil Nadu (33)</option>
                <option value="Uttar Pradesh">Uttar Pradesh (09)</option>
                <option value="Goa">Goa (30)</option>
              </select>
            </div>
            <div className="col-sm-6">
              <label className="form-label">GSTIN (Optional)</label>
              <input
                type="text"
                name="gstin"
                className="form-control"
                placeholder="27AAAAA0000A1Z5"
                value={formData.gstin}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="border-top my-3"></div>

          <div className="row g-2 mb-3">
            <div className="col-sm-6">
              <label className="form-label">Your Name*</label>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-sm-6">
              <label className="form-label">Mobile Number</label>
              <input
                type="tel"
                name="mobile"
                className="form-control"
                placeholder="10-digit mobile"
                value={formData.mobile}
                onChange={handleChange}
              />
            </div>
            <div className="col-12">
              <label className="form-label">Email Address*</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-12">
              <label className="form-label">Password*</label>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Create secure password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary-zenith w-100 justify-content-center py-2 mb-3"
            disabled={loading}
          >
            {loading ? 'Creating Business Workspace...' : 'Register & Launch ERP'}
          </button>

          <div className="text-center small text-muted">
            Already have an account? <NavLink to="/login" className="fw-bold text-primary text-decoration-none">Sign In</NavLink>
          </div>
        </form>
      </div>
    </div>
  );
};
