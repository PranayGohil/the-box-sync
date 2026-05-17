import React, { useState, useContext } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import axios from 'axios';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import { AuthContext } from 'contexts/AuthContext';
import { toast } from 'react-toastify';

const brandColor = '#23b3f4';

const Login = () => {
  const title = 'Login — The Box QSR';
  const description = 'Secure QSR operator login to The Box operations panel.';

  const { login } = useContext(AuthContext);

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation Schema
  const validationSchema = Yup.object().shape({
    restaurant_code: Yup.string().required('Restaurant Code is required'),
    username: Yup.string().required('Username is required'),
    password: Yup.string().required('Password is required'),
  });

  // Submit Handler
  const onSubmit = async (values) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/panel-user/login/QSR`, values);
      if (res.data.message === 'Logged In') {
        setTimeout(() => {
          login(res.data.token, res.data.user);
          window.location.href = '/order/new?mode=new';
        }, 500);
      } else {
        setError(res.data.message);
        setIsLoading(false);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: { restaurant_code: '', username: '', password: '' },
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
            Your QSR Outlet,<br />
            <span>Perfected.</span>
          </h1>
          <p className="login-login-hero-sub">
            Fast billing, real-time Kitchen Order Ticket (KOT) synchronization, and lightning-quick takeaways & deliveries.
          </p>
          <div className="login-login-feature-pills">
            {['Lightning-Fast Billing', 'Real-time KOT Synchronization', 'Online Partner Integrations', 'Instant Bill Printing'].map((f) => (
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
            <div className="login-login-form-eyebrow">QSR Operator Portal</div>
            <h2 className="login-login-form-title">Operator Access</h2>
            <p className="login-login-form-subtitle">Sign in to your outlet control panel</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="login-auth-alert-error">
                <CsLineIcons icon="warning-hexagon" size="18" />
                {error}
              </div>
            )}

            {/* Restaurant Code */}
            <div className="login-auth-input-group">
              <label className="login-auth-input-label">Restaurant Code</label>
              <div style={{ position: 'relative' }}>
                <span className="login-auth-input-icon">
                  <CsLineIcons icon="building" size="18" />
                </span>
                <input
                  type="text"
                  name="restaurant_code"
                  placeholder="e.g. TBOX101"
                  value={values.restaurant_code}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="login-auth-input form-control"
                />
              </div>
              {errors.restaurant_code && touched.restaurant_code && (
                <div className="login-auth-error-msg">
                  <CsLineIcons icon="warning" size="13" />
                  {errors.restaurant_code}
                </div>
              )}
            </div>

            {/* Username */}
            <div className="login-auth-input-group">
              <label className="login-auth-input-label">Username</label>
              <div style={{ position: 'relative' }}>
                <span className="login-auth-input-icon">
                  <CsLineIcons icon="user" size="18" />
                </span>
                <input
                  type="text"
                  name="username"
                  placeholder="Operator username"
                  value={values.username}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="login-auth-input form-control"
                />
              </div>
              {errors.username && touched.username && (
                <div className="login-auth-error-msg">
                  <CsLineIcons icon="warning" size="13" />
                  {errors.username}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="login-auth-input-group">
              <label className="login-auth-input-label">Password</label>
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

          <div className="login-auth-footer-link" style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
            To create or manage QSR operator credentials, please use your <strong>Admin Dashboard</strong>.
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
