import React, { useState, useContext } from 'react';
import { Spinner } from 'react-bootstrap';
import axios from 'axios';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import { AuthContext } from 'contexts/AuthContext';

const Login = () => {
  const title = 'Login — Attendance';
  const description = 'Attendance kiosk login — use your Payroll account email and password.';

  const { login } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = Yup.object().shape({
    email: Yup.string().email('Enter a valid email').required('Email is required'),
    password: Yup.string().required('Password is required'),
  });

  const onSubmit = async (values) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/kiosk/login`, {
        email: values.email,
        password: values.password,
      });
      if (res.data.message === 'Logged In') {
        login(res.data.token, res.data.user);
        window.location.href = '/dashboard';
      } else {
        setError(res.data.message || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
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
            Smart Attendance,<br />
            <span>Effortlessly Tracked.</span>
          </h1>
          <p className="login-login-hero-sub">
            Face recognition attendance terminal for your payroll staff — integrated directly with your payroll account.
          </p>
          <div className="login-login-feature-pills">
            {['Face Recognition Check-In', 'Real-Time Attendance Logs', 'Payroll Integration', 'Same Login as Payroll'].map((f) => (
              <div key={f} className="login-login-feature-pill">
                <div className="login-login-feature-pill-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="login-login-right-panel">
          <div className="login-login-form-header">
            <div className="login-login-form-eyebrow">Attendance Kiosk</div>
            <h2 className="login-login-form-title">Welcome back</h2>
            <p className="login-login-form-subtitle">Use your Payroll account credentials to sign in</p>
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
                  placeholder="you@company.com"
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

          <div className="login-auth-powered">
            Powered by <strong>TheBoxSync</strong>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
