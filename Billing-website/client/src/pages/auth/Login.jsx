import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('owner@demo.local');
  const [password, setPassword] = useState('Demo@12345');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleDemoFill = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('Demo@12345');
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-3">
      <div className="card-zenith p-4 p-md-5" style={{ maxWidth: '440px', width: '100%' }}>
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-3 mb-2"
            style={{ width: '50px', height: '50px', fontSize: '1.6rem' }}
          >
            <i className="bi bi-boxes"></i>
          </div>
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>Zenith ERP</h4>
          <p className="text-muted small">GST Billing, Inventory & Double-Entry Accounting</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <label className="form-label mb-0">Password</label>
            </div>
            <input
              type="password"
              className="form-control mt-1"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary-zenith w-100 justify-content-center py-2 mb-3"
            disabled={loading}
          >
            {loading ? (
              <span><span className="spinner-border spinner-border-sm me-2"></span>Logging in...</span>
            ) : (
              <span>Sign In to Workspace <i className="bi bi-arrow-right ms-1"></i></span>
            )}
          </button>

          <div className="text-center small text-muted mb-4">
            Don't have an organization? <NavLink to="/register" className="fw-bold text-primary text-decoration-none">Create Business</NavLink>
          </div>
        </form>

        {/* Quick Demo Credentials Autofill Helper */}
        <div className="border-top pt-3 text-center">
          <div className="small fw-bold text-muted mb-2">⚡ Quick 1-Click Demo Accounts:</div>
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm px-2 py-1"
              style={{ fontSize: '0.75rem' }}
              onClick={() => handleDemoFill('owner@demo.local')}
            >
              👑 Owner
            </button>
            <button
              type="button"
              className="btn btn-outline-success btn-sm px-2 py-1"
              style={{ fontSize: '0.75rem' }}
              onClick={() => handleDemoFill('accountant@demo.local')}
            >
              📊 Accountant
            </button>
            <button
              type="button"
              className="btn btn-outline-warning btn-sm px-2 py-1 text-dark"
              style={{ fontSize: '0.75rem' }}
              onClick={() => handleDemoFill('billing@demo.local')}
            >
              ⚡ Billing Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
