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

const Login = () => {
  const title = 'Login — The Box';
  const description = 'Secure payroll & staff login to The Box management panel.';

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
      <HtmlHead title={title} description={description} />

      <div className="login-login-page-wrapper">
        {/* Left Panel */}
        <div className="login-login-left-panel">
          <div className="login-login-brand-logo">THE <span>BOX</span></div>
          <h1 className="login-login-hero-title">
            Your Workforce,<br />
            <span>Perfectly Managed.</span>
          </h1>
          <p className="login-login-hero-sub">
            A powerful payroll and staff management platform to streamline tracking, holidays, advances, and payouts — all in one place.
          </p>
          <div className="login-login-feature-pills">
            {['Comprehensive Leave Policy', 'Smart Attendance & Shifts', 'Salary Advances & Payouts', 'Disbursement & HR Reports'].map((f) => (
              <div key={f} className="login-login-feature-pill">
                <div className="login-login-feature-pill-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel — Login Form */}
        <div className="login-login-right-panel">
          <div className="login-login-form-header">
            <div className="login-login-form-eyebrow">HR Portal</div>
            <h2 className="login-login-form-title">Welcome back</h2>
            <p className="login-login-form-subtitle">Sign in to your control panel</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="login-auth-alert-error">
                <CsLineIcons icon="warning-hexagon" size="18" />
                {error}
              </div>
            )}

            {/* Email */}
            <div className="login-auth-input-group">
              <label className="login-auth-input-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <span className="login-auth-input-icon">
                  <CsLineIcons icon="email" size="18" />
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@restaurant.com"
                  value={values.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="login-auth-input form-control"
                />
              </div>
              {errors.email && touched.email && (
                <div className="login-auth-error-msg">
                  <CsLineIcons icon="warning" size="13" />
                  {errors.email}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="login-auth-input-group">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="login-auth-input-label mb-0">Password</label>
                <NavLink to="/forgot-password" style={{ fontSize: '0.75rem', fontWeight: '700' }} className="login-auth-forgot-link" onClick={(e) => isLoading && e.preventDefault()}>
                  Forgot password?
                </NavLink>
              </div>
              <div style={{ position: 'relative' }}>
                <span className="login-auth-input-icon">
                  <CsLineIcons icon="lock-off" size="18" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={values.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="login-auth-input form-control"
                />
                <span className="login-auth-input-icon-right" onClick={() => setShowPassword(!showPassword)}>
                  <CsLineIcons icon={showPassword ? 'eye-off' : 'eye'} size="18" />
                </span>
              </div>
              {errors.password && touched.password && (
                <div className="login-auth-error-msg">
                  <CsLineIcons icon="warning" size="13" />
                  {errors.password}
                </div>
              )}
            </div>

            <button type="submit" className="login-btn-auth-primary" disabled={isLoading}>
              {isLoading ? (
                <><Spinner as="span" animation="border" size="sm" className="me-2" />Signing in...</>
              ) : (
                <><CsLineIcons icon="login" size="17" className="me-2" />Sign In</>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-muted">Don't have an account? </span>
            <NavLink to="/register" style={{ fontWeight: '700', textDecoration: 'none' }} className="text-primary">
              Sign up
            </NavLink>
          </div>

          <div className="login-auth-powered">
            Powered by <strong>TheBoxSync</strong>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;