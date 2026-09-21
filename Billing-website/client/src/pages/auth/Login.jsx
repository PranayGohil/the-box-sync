import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('owner@theboxsync.com');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
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
    setPassword('Password@123');
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-2 p-sm-3">
      <div className="card-zenith p-3 p-sm-4 p-md-5 my-3 shadow-lg" style={{ maxWidth: '460px', width: '100%', borderRadius: '16px' }}>
        <div className="text-center mb-4">
          <img
            src="/logo-blue.svg"
            alt="TheBox Logo"
            className="mb-2"
            style={{ height: '46px', maxWidth: '190px', objectFit: 'contain' }}
          />
          <h4 className="fw-bold mb-1" style={{ letterSpacing: '-0.02em' }}>Welcome Back</h4>
          <p className="text-muted small mb-0">GST Invoicing, Multi-Warehouse Inventory & Double-Entry Accounting</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-bold mb-1">Email Address*</label>
            <div className="position-relative">
              <input
                type="email"
                className="form-control form-control-sm"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label small fw-bold mb-0">Password*</label>
            </div>
            <div className="position-relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control form-control-sm pe-5"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <button
            type="submit"
            className="btn btn-primary-zenith w-100 justify-content-center py-2 mb-3 fw-bold shadow-sm text-nowrap"
            disabled={loading}
          >
            {loading ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2"></span>Logging in...
              </span>
            ) : (
              <span>
                Sign In to Workspace <i className="bi bi-arrow-right ms-1"></i>
              </span>
            )}
          </button>

          <div className="text-center small text-muted mb-4">
            Don't have an organization?{' '}
            <NavLink to="/register" className="fw-bold text-primary text-decoration-none">
              Create Business
            </NavLink>
          </div>
        </form>

        {/* Quick Role Credentials Autofill Helper */}
        <div className="border-top pt-3 text-center">
          <div className="text-uppercase text-muted fw-bold mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.05em' }}>
            ⚡ 1-Click Instant Role Access:
          </div>
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            <button
              type="button"
              className={`btn btn-sm px-2 py-1 flex-fill flex-sm-grow-0 ${email === 'owner@theboxsync.com' ? 'btn-primary text-white' : 'btn-outline-primary'}`}
              style={{ fontSize: '0.75rem' }}
              onClick={() => handleDemoFill('owner@theboxsync.com')}
            >
              👑 Owner
            </button>
            <button
              type="button"
              className={`btn btn-sm px-2 py-1 flex-fill flex-sm-grow-0 ${email === 'accountant@theboxsync.com' ? 'btn-success text-white' : 'btn-outline-success'}`}
              style={{ fontSize: '0.75rem' }}
              onClick={() => handleDemoFill('accountant@theboxsync.com')}
            >
              📊 Accountant
            </button>
            <button
              type="button"
              className={`btn btn-sm px-2 py-1 flex-fill flex-sm-grow-0 ${email === 'billing@theboxsync.com' ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'}`}
              style={{ fontSize: '0.75rem' }}
              onClick={() => handleDemoFill('billing@theboxsync.com')}
            >
              ⚡ Billing Staff
            </button>
            <button
              type="button"
              className={`btn btn-sm px-2 py-1 flex-fill flex-sm-grow-0 ${email === 'inventory@theboxsync.com' ? 'btn-info text-dark' : 'btn-outline-info text-dark'}`}
              style={{ fontSize: '0.75rem' }}
              onClick={() => handleDemoFill('inventory@theboxsync.com')}
            >
              📦 Inventory Mgr
            </button>
          </div>
          <div className="mt-2 text-muted" style={{ fontSize: '0.72rem' }}>
            Password: <code className="bg-light px-1 py-0.5 rounded text-dark font-mono">Password@123</code>
          </div>
        </div>
      </div>
    </div>
  );
};
