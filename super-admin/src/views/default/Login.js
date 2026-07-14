import React, { useState, useContext } from 'react';
import { Spinner } from 'react-bootstrap';
import axios from 'axios';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import { AuthContext } from 'contexts/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const title = 'Login — Super Admin';
  const description = 'Secure super admin login to The Box management panel.';

  const { login } = useContext(AuthContext);

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Email is required'),
    ...(step === 2 && {
      otp: Yup.string().length(6, 'OTP must be exactly 6 digits').required('OTP is required'),
    }),
  });

  const onSubmit = async (values) => {
    setIsLoading(true);
    setError('');
    try {
      if (step === 1) {
        // Request OTP
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/superadmin/request-otp`, { email: values.email });
        if (res.status === 200) {
          toast.success("OTP sent successfully!");
          setStep(2);
        }
      } else {
        // Verify OTP
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/superadmin/verify-otp`, { 
          email: values.email, 
          otp: values.otp 
        });
        if (res.status === 200) {
          setTimeout(async () => {
            try {
              login(res.data.token, res.data.user || {});
              window.location.href = '/';
            } catch (err) {
              console.error('Error logging in', err);
              window.location.href = '/';
            }
          }, 500);
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Authentication failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: { email: '', otp: '' },
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
            The Command Center,<br />
            <span>Absolute Control.</span>
          </h1>
          <p className="login-login-hero-sub">
            The master admin platform to manage users, restaurants, subscriptions, and system-wide operations.
          </p>
          <div className="login-login-feature-pills">
            {['Global Management', 'Restaurant Onboarding', 'Subscription Tracking', 'Master Dashboard'].map((f) => (
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
            <div className="login-login-form-eyebrow">Super Admin Portal</div>
            <h2 className="login-login-form-title">Welcome back</h2>
            <p className="login-login-form-subtitle">Secure OTP verification to access the central control panel</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="login-auth-alert-error">
                <CsLineIcons icon="warning-hexagon" size="18" />
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="login-auth-input-group">
              <label className="login-auth-input-label">Authorized Email Address</label>
              <div style={{ position: 'relative' }}>
                <span className="login-auth-input-icon">
                  <CsLineIcons icon="email" size="18" />
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter authorized email"
                  value={values.email}
                  onChange={handleChange}
                  disabled={isLoading || step === 2}
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

            {/* OTP Field (Only show on Step 2) */}
            {step === 2 && (
              <div className="login-auth-input-group">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="login-auth-input-label mb-0">Enter 6-Digit OTP</label>
                </div>
                <div style={{ position: 'relative' }}>
                  <span className="login-auth-input-icon">
                    <CsLineIcons icon="lock-off" size="18" />
                  </span>
                  <input
                    type="text"
                    name="otp"
                    placeholder="••••••"
                    maxLength={6}
                    value={values.otp}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="login-auth-input form-control fw-bold tracking-widest"
                    style={{ letterSpacing: '4px' }}
                  />
                </div>
                {errors.otp && touched.otp && (
                  <div className="login-auth-error-msg">
                    <CsLineIcons icon="warning" size="13" />
                    {errors.otp}
                  </div>
                )}
                <div className="text-end mt-2">
                  <button 
                    type="button" 
                    className="btn btn-link p-0 fw-bold text-decoration-none" 
                    style={{ fontSize: "0.8rem" }}
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/superadmin/request-otp`, { email: values.email });
                        if (res.status === 200) {
                          toast.success("OTP resent successfully!");
                          formik.setFieldValue('otp', '');
                        }
                      } catch (err) {
                        toast.error(err.response?.data?.message || 'Failed to resend OTP');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="login-btn-auth-primary mt-3" disabled={isLoading}>
              {isLoading ? (
                <><Spinner as="span" animation="border" size="sm" className="me-2" />Please wait...</>
              ) : (
                <><CsLineIcons icon="login" size="17" className="me-2" />{step === 1 ? "Send OTP" : "Verify & Sign In"}</>
              )}
            </button>
          </form>

          <div className="login-auth-powered mt-5">
            Powered by <strong><a href="https://theboxsync.com" target="_blank" rel="noopener noreferrer">TheBoxSync</a></strong>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
