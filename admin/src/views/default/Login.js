import React, { useState, useContext } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { Button, Form, Spinner } from 'react-bootstrap';
import axios from 'axios';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import { AuthContext } from 'contexts/AuthContext';
import { toast } from 'react-toastify';

const brandColor = '#23b3f4';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  .login-page-wrapper {
    min-height: 100vh;
    display: flex;
    font-family: 'Inter', sans-serif;
    background: #f0f4f8;
  }

  /* Left Panel */
  .login-left-panel {
    flex: 1;
    background: linear-gradient(145deg, #0d1b2a 0%, #1a3a5c 40%, #0e6fa8 80%, #23b3f4 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 3rem 4rem;
    position: relative;
    overflow: hidden;
  }

  .login-left-panel::before {
    content: '';
    position: absolute;
    top: -120px;
    right: -120px;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: rgba(35, 179, 244, 0.15);
    filter: blur(60px);
  }

  .login-left-panel::after {
    content: '';
    position: absolute;
    bottom: -80px;
    left: -80px;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.06);
    filter: blur(50px);
  }

  .login-brand-logo {
    font-size: 1.8rem;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: 0.15em;
    margin-bottom: 3rem;
    text-shadow: 0 2px 20px rgba(0,0,0,0.3);
    position: relative;
    z-index: 1;
  }

  .login-brand-logo span {
    color: ${brandColor};
  }

  .login-hero-title {
    font-size: 2.8rem;
    font-weight: 900;
    color: #ffffff;
    line-height: 1.2;
    margin-bottom: 1.5rem;
    position: relative;
    z-index: 1;
    text-shadow: 0 2px 20px rgba(0,0,0,0.2);
  }

  .login-hero-title span {
    color: ${brandColor};
  }

  .login-hero-sub {
    font-size: 1rem;
    color: rgba(255,255,255,0.65);
    line-height: 1.7;
    max-width: 380px;
    margin-bottom: 3rem;
    position: relative;
    z-index: 1;
  }

  .login-feature-pills {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    position: relative;
    z-index: 1;
  }

  .login-feature-pill {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 50px;
    padding: 0.6rem 1.25rem;
    color: rgba(255,255,255,0.85);
    font-size: 0.85rem;
    font-weight: 600;
    width: fit-content;
  }

  .login-feature-pill-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${brandColor};
    flex-shrink: 0;
  }

  /* Right Panel */
  .login-right-panel {
    width: 480px;
    min-height: 100vh;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 3rem 3.5rem;
    position: relative;
    box-shadow: -20px 0 60px rgba(0,0,0,0.08);
  }

  .login-form-header {
    margin-bottom: 2.5rem;
  }

  .login-form-eyebrow {
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: ${brandColor};
    margin-bottom: 0.5rem;
  }

  .login-form-title {
    font-size: 2rem;
    font-weight: 900;
    color: #0f172a;
    line-height: 1.2;
    margin-bottom: 0.5rem;
  }

  .login-form-subtitle {
    font-size: 0.9rem;
    color: #64748b;
    font-weight: 500;
  }

  /* Input Groups */
  .auth-input-group {
    position: relative;
    margin-bottom: 1.25rem;
  }

  .auth-input-label {
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: ${brandColor};
    margin-bottom: 0.5rem;
    display: block;
  }

  .auth-input {
    width: 100%;
    padding: 0.85rem 1rem 0.85rem 3rem !important;
    border: 1.5px solid ${brandColor} !important;
    border-radius: 0.875rem !important;
    font-size: 0.9rem !important;
    font-weight: 600 !important;
    color: #0f172a !important;
    background: #ffffff !important;
    transition: all 0.2s ease !important;
    outline: none !important;
  }

  .auth-input:focus {
    border-color: ${brandColor} !important;
    background: #ffffff !important;
    box-shadow: 0 0 0 4px rgba(35, 179, 244, 0.1) !important;
  }

  .auth-input-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: ${brandColor};
    display: flex;
    align-items: center;
    pointer-events: none;
  }

  .auth-input-icon-right {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: color 0.2s;
  }

  .auth-input-icon-right:hover {
    color: ${brandColor};
  }

  .auth-error-msg {
    font-size: 0.78rem;
    font-weight: 600;
    color: #ef4444;
    margin-top: 0.4rem;
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  /* Premium button */
  .btn-auth-primary {
    width: 100%;
    padding: 0.9rem 1.5rem !important;
    background: #ffffff !important;
    border: 1.5px solid ${brandColor} !important;
    border-radius: 50px !important;
    font-size: 0.95rem !important;
    font-weight: 800 !important;
    color: ${brandColor} !important;
    letter-spacing: 0.03em !important;
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.1) !important;
    transition: all 0.3s ease !important;
    margin-top: 0.5rem;
  }

  .btn-auth-primary:hover:not(:disabled) {
    background: ${brandColor} !important;
    color: #ffffff !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 8px 20px rgba(35, 179, 244, 0.3) !important;
  }

  .btn-auth-primary:disabled {
    opacity: 0.5 !important;
    cursor: not-allowed !important;
  }

  .auth-footer-link {
    text-align: center;
    margin-top: 2rem;
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 500;
  }

  .auth-footer-link a {
    color: ${brandColor};
    font-weight: 700;
    text-decoration: none;
    transition: opacity 0.2s;
  }

  .auth-footer-link a:hover {
    opacity: 0.8;
    text-decoration: underline;
  }

  .auth-divider {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1.5rem 0;
  }

  .auth-divider-line {
    flex: 1;
    height: 1px;
    background: #e2e8f0;
  }

  .auth-divider-text {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 600;
  }

  .auth-alert-error {
    background: rgba(239, 68, 68, 0.06);
    border: 1.5px solid rgba(239, 68, 68, 0.2);
    border-radius: 0.875rem;
    padding: 0.85rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #ef4444;
  }

  .auth-forgot-link {
    font-size: 0.8rem;
    font-weight: 600;
    color: ${brandColor};
    text-decoration: none;
    transition: opacity 0.2s;
  }

  .auth-forgot-link:hover {
    opacity: 0.75;
    text-decoration: underline;
  }

  .auth-powered {
    text-align: center;
    margin-top: 2.5rem;
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 500;
  }

  .auth-powered strong {
    color: #475569;
    font-weight: 800;
  }

  /* Responsive */
  @media (max-width: 991px) {
    .login-left-panel {
      display: none;
    }
    .login-right-panel {
      width: 100%;
      padding: 2.5rem 1.75rem;
      box-shadow: none;
    }
    .login-hero-title {
      font-size: 2rem;
    }
  }

  @media (max-width: 480px) {
    .login-right-panel {
      padding: 2rem 1.25rem;
    }
    .login-form-title {
      font-size: 1.6rem;
    }
  }

  .disabled-link {
    pointer-events: none;
    opacity: 0.5;
  }
`;

const Login = () => {
  const title = 'Login — The Box';
  const description = 'Secure admin login to The Box management panel.';

  const { login } = useContext(AuthContext);

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle Impersonation Token
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('impersonate_token');
    if (token) {
      setIsLoading(true);
      toast.info('Logging in via Super Admin...');
      axios.get(`${process.env.REACT_APP_API}/user/get`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (res.data && res.data !== 'Null') {
          login(token, res.data);
          window.location.href = '/';
        } else {
          toast.error('Impersonation token invalid or expired.');
          setIsLoading(false);
        }
      }).catch(() => {
        toast.error('Failed to fetch user data for impersonation.');
        setIsLoading(false);
      });
    }
  }, []);

  const validationSchema = Yup.object().shape({
    email: Yup.string().email().required('Email is required'),
    password: Yup.string().min(6, 'Must be at least 6 chars!').required('Password is required'),
  });

  const onSubmit = async (values) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/user/login`, values);
      if (res.data.success) {
        setTimeout(() => {
          login(res.data.token, res.data.user);
          window.location.href = '/';
        }, 500);
      } else {
        setError(res.data.message);
        setIsLoading(false);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Something went wrong';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema,
    onSubmit,
  });

  const { handleSubmit, handleChange, values, touched, errors } = formik;

  return (
    <>
      <style>{styles}</style>
      <HtmlHead title={title} description={description} />

      <div className="login-page-wrapper">
        {/* Left Panel */}
        <div className="login-left-panel">
          <div className="login-brand-logo">THE <span>BOX</span></div>
          <h1 className="login-hero-title">
            Your Restaurant,<br />
            <span>Perfectly Managed.</span>
          </h1>
          <p className="login-hero-sub">
            A powerful admin platform to manage orders, inventory, staff, and operations — all in one place.
          </p>
          <div className="login-feature-pills">
            {['Real-time Order Tracking', 'Inventory Intelligence', 'Staff & Payroll Management', 'Financial Reporting'].map((f) => (
              <div key={f} className="login-feature-pill">
                <div className="login-feature-pill-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel — Login Form */}
        <div className="login-right-panel">
          <div className="login-form-header">
            <div className="login-form-eyebrow">Admin Portal</div>
            <h2 className="login-form-title">Welcome back</h2>
            <p className="login-form-subtitle">Sign in to your control panel</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="auth-alert-error">
                <CsLineIcons icon="warning-hexagon" size="18" />
                {error}
              </div>
            )}

            {/* Email */}
            <div className="auth-input-group">
              <label className="auth-input-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <span className="auth-input-icon"><CsLineIcons icon="email" size="16" /></span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@restaurant.com"
                  value={values.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="auth-input form-control"
                />
              </div>
              {errors.email && touched.email && (
                <div className="auth-error-msg"><CsLineIcons icon="warning" size="13" />{errors.email}</div>
              )}
            </div>

            {/* Password */}
            <div className="auth-input-group">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="auth-input-label mb-0">Password</label>
                <NavLink to="/forgot-password" className="auth-forgot-link" onClick={(e) => isLoading && e.preventDefault()}>
                  Forgot password?
                </NavLink>
              </div>
              <div style={{ position: 'relative' }}>
                <span className="auth-input-icon"><CsLineIcons icon="lock-off" size="16" /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={values.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="auth-input form-control"
                />
                <span className="auth-input-icon-right" onClick={() => setShowPassword(!showPassword)}>
                  <CsLineIcons icon={showPassword ? 'eye-off' : 'eye'} size="16" />
                </span>
              </div>
              {errors.password && touched.password && (
                <div className="auth-error-msg"><CsLineIcons icon="warning" size="13" />{errors.password}</div>
              )}
            </div>

            <button type="submit" className="btn-auth-primary" disabled={isLoading}>
              {isLoading ? (
                <><Spinner as="span" animation="border" size="sm" className="me-2" />Signing in...</>
              ) : (
                <><CsLineIcons icon="login" size="17" className="me-2" />Sign In</>
              )}
            </button>
          </form>

          <div className="auth-footer-link">
            Don't have an account? <NavLink to="/register">Create one →</NavLink>
          </div>

          <div className="auth-powered">
            Powered by <strong>TheBoxSync</strong>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
