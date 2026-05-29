import React, { useState, useContext } from 'react';
import { Spinner } from 'react-bootstrap';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import axios from 'axios';
import { AuthContext } from 'contexts/AuthContext';

const Login = () => {
  const title = 'Manager Login — The Box';
  const description = 'Secure manager access to the management portal.';

  const { login } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [wrongMsg, setWrongMsg] = useState('');

  const validationSchema = Yup.object().shape({
    restaurant_code: Yup.string().required('Restaurant Code is required'),
    username: Yup.string().required('Username is required'),
    password: Yup.string().required('Password is required'),
  });

  const initialValues = { restaurant_code: '', username: '', password: '' };

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/panel-user/login/Manager`, values);
      if (res.data.message === 'Logged In') {
        login(res.data.token, res.data.user);
        window.location.href = '/';
      } else {
        setWrongMsg(res.data.message);
      }
    } catch (err) {
      console.error(err);
      setWrongMsg('Login failed. Please try again.');
    }
    setSubmitting(false);
  };

  const formik = useFormik({ initialValues, validationSchema, onSubmit });
  const { handleSubmit, handleChange, values, touched, errors, isSubmitting } = formik;

  return (
    <>
      <HtmlHead title={title} description={description} />

      <div className="login-login-page-wrapper">
        {/* Left Panel */}
        <div className="login-login-left-panel">
          <div className="login-login-brand-logo">THE <span>BOX</span></div>
          <h1 className="login-login-hero-title">
            Your Restaurant,<br />
            <span>Perfectly Managed.</span>
          </h1>
          <p className="login-login-hero-sub">
            A powerful admin platform to manage orders, inventory, staff, and operations — all in one place.
          </p>
          <div className="login-login-feature-pills">
            {['Real-time Order Tracking', 'Inventory Intelligence', 'Staff & Payroll Management', 'Financial Reporting'].map((f) => (
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
            <div className="login-login-form-eyebrow">Manager Portal</div>
            <h2 className="login-login-form-title">Welcome back</h2>
            <p className="login-login-form-subtitle">Sign in to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit}>
            {wrongMsg && (
              <div className="login-auth-alert-error">
                <CsLineIcons icon="warning-hexagon" size="18" />
                {wrongMsg}
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
                  placeholder="e.g. REST101"
                  value={values.restaurant_code}
                  onChange={handleChange}
                  disabled={isSubmitting}
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
                  placeholder="yourusername"
                  value={values.username}
                  onChange={handleChange}
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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

            <button type="submit" className="login-btn-auth-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Spinner as="span" animation="border" size="sm" className="me-2" />Signing in...</>
              ) : (
                <><CsLineIcons icon="login" size="17" className="me-2" />Sign In</>
              )}
            </button>
          </form>

          <div className="login-auth-powered">
            Powered by <strong>TheBoxSync</strong>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
