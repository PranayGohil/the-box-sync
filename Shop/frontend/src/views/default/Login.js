import React, { useState, useContext, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import { AuthContext } from 'contexts/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const title = 'Login — The Box';
  const description = 'Secure admin login to The Box management panel.';

  const apiBase = process.env.REACT_APP_API || 'http://localhost:5001/api';

  const { login } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Send OTP, Step 2: Verify OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle Impersonation Token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('impersonate_token');
    if (token) {
      setIsLoading(true);
      toast.info('Logging in via Super Admin...');
      axios.get(`${apiBase}/user/get`, {
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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.post(`${apiBase}/user/send-otp`, { email, login_from: 'shop' });
      setSuccess(response.data.message || 'OTP sent successfully to your email!');
      setStep(2); // Move to the OTP verification step
    } catch (err) {
      const errMsg = err.response?.data?.message || 'An error occurred while sending OTP.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.post(`${apiBase}/user/verify-otp`, { email, otp, login_from: 'shop' });
      if (!response.data.verified) {
        throw new Error('OTP verification failed.');
      } else {
        // Successful login
        const { token, user } = response.data;
        if (user.is_shop && !user.isApproved) {
            toast.info("Your account is pending activation from the Theboxsync side. We will notify you once it is activated.", { autoClose: 5000 });
            setIsLoading(false);
            return;
        }
        setSuccess('OTP verified! Logging you in...');
        login(token, user);
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid OTP.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const stepHeader = {
    1: {
      title: 'Welcome back',
      subtitle: 'Sign in to your control panel with your email',
    },
    2: {
      title: 'Verify your OTP',
      subtitle: 'Almost there — let’s confirm it’s you',
    },
  };

  return (
    <>
      <HtmlHead title={title} description={description} />

      <div className="login-login-page-wrapper">
        {/* Left Panel */}
        <div className="login-login-left-panel">
          <div className="login-login-brand-logo">
            THE <span>BOX</span>
          </div>
          <h1 className="login-login-hero-title">
            Your Shop,
            <br />
            <span>Perfectly Managed.</span>
          </h1>
          <p className="login-login-hero-sub">A powerful admin platform to manage orders, inventory, staff, and operations — all in one place.</p>
          <div className="login-login-feature-pills">
            {['Real-time Order Tracking', 'Inventory Intelligence', 'Staff & Payroll Management', 'Financial Reporting'].map((f) => (
              <div key={f} className="login-login-feature-pill">
                <div className="login-login-feature-pill-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel — Login form */}
        <div className="login-login-right-panel">
          <div className="login-login-form-header">
            <div className="login-login-form-eyebrow">Shop Management Portal</div>
            <h2 className="login-login-form-title">{stepHeader[step].title}</h2>
            <p className="login-login-form-subtitle">{stepHeader[step].subtitle}</p>
          </div>

          {error && (
            <div className="login-auth-alert-error">
              <CsLineIcons icon="warning-hexagon" size="18" />
              {error}
            </div>
          )}

          {success && (
            <div
              className="login-auth-alert-success"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                border: '1px solid rgba(25, 135, 84, 0.2)',
                borderRadius: '12px',
                color: '#198754',
                fontSize: '0.875rem',
                marginBottom: '20px',
                fontWeight: '500',
              }}
            >
              <CsLineIcons icon="check-circle" size="18" />
              {success}
            </div>
          )}

          {/* STEP 1: Enter Email & Send OTP */}
          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <div className="login-auth-input-group">
                <label className="login-auth-input-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <span className="login-auth-input-icon">
                    <CsLineIcons icon="email" size="18" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email ID"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="login-auth-input form-control"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="login-btn-auth-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <CsLineIcons icon="login" size="17" className="me-2" />
                    Send Login OTP
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Verify OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <div className="login-auth-input-group">
                <label className="login-auth-input-label">OTP Code</label>
                <div style={{ position: 'relative' }}>
                  <span className="login-auth-input-icon">
                    <CsLineIcons icon="key" size="18" />
                  </span>
                  <input
                    type="text"
                    name="otp"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={isLoading}
                    className="login-auth-input form-control"
                    required
                  />
                </div>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="login-btn-auth-primary bg-secondary border-secondary px-4 w-auto text-nowrap"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                >
                  Back
                </button>
                <button type="submit" className="login-btn-auth-primary flex-grow-1 px-4 w-auto text-nowrap" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CsLineIcons icon="check" size="17" className="me-2" />
                      Verify OTP & Login
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="login-auth-footer-link">
            Don't have an account? <NavLink to="/register">Register →</NavLink>
          </div>

          <div className="login-auth-powered">
            Powered by{' '}
            <strong>
              <a href="https://theboxsync.com" target="_blank" rel="noopener noreferrer">
                TheBoxSync
              </a>
            </strong>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
