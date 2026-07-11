import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { Spinner } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const title = 'Forgot Password — TheBoxSync';
  const description = 'Reset your admin password to TheBoxSync management panel.';

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Request OTP, Step 2: Verify OTP, Step 3: Reset Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.post(`${process.env.REACT_APP_API}/user/send-otp`, { email });
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
      const response = await axios.post(`${process.env.REACT_APP_API}/user/verify-otp`, { email, otp });
      if (!response.data.verified) {
        throw new Error('OTP verification failed.');
      } else {
        setSuccess(response.data.message || 'OTP verified successfully!');
        setStep(3); // Move to the Password reset step
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid OTP.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API}/user/reset-password`, { email, newPassword });
      setSuccess(response.data.message || 'Password reset successfully!');
      toast.success(response.data.message || 'Password reset successfully!');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'An error occurred while resetting your password.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const stepHeader = {
    1: {
      title: 'Forgot password?',
      subtitle: 'No worries — we’ll help you reset it',
    },
    2: {
      title: 'Verify your OTP',
      subtitle: 'Almost there — let’s confirm it’s you',
    },
    3: {
      title: 'Reset your password',
      subtitle: 'Create a new password to secure your account',
    },
  };

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

        {/* Right Panel — Forgot Password form */}
        <div className="login-login-right-panel">
          <div className="login-login-form-header">
            <div className="login-login-form-eyebrow">Admin Portal</div>
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
                  <><Spinner as="span" animation="border" size="sm" className="me-2" />Sending...</>
                ) : (
                  <><CsLineIcons icon="email" size="17" className="me-2" />Send OTP</>
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
                    placeholder="Enter verification OTP"
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
                    <><Spinner as="span" animation="border" size="sm" className="me-2" />Verifying...</>
                  ) : (
                    <><CsLineIcons icon="check" size="17" className="me-2" />Verify OTP</>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="login-auth-input-group">
                <label className="login-auth-input-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <span className="login-auth-input-icon">
                    <CsLineIcons icon="lock-off" size="18" />
                  </span>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    className="login-auth-input form-control"
                    required
                  />
                  <span className="login-auth-input-icon-right" onClick={() => setShowNewPassword(!showNewPassword)}>
                    <CsLineIcons icon={showNewPassword ? 'eye-off' : 'eye'} size="18" />
                  </span>
                </div>
              </div>

              <div className="login-auth-input-group">
                <label className="login-auth-input-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <span className="login-auth-input-icon">
                    <CsLineIcons icon="lock-off" size="18" />
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="login-auth-input form-control"
                    required
                  />
                  <span className="login-auth-input-icon-right" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <CsLineIcons icon={showConfirmPassword ? 'eye-off' : 'eye'} size="18" />
                  </span>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="login-btn-auth-primary bg-secondary border-secondary px-4 w-auto text-nowrap"
                  onClick={() => setStep(2)}
                  disabled={isLoading}
                >
                  Back
                </button>
                <button type="submit" className="login-btn-auth-primary flex-grow-1 px-4 w-auto text-nowrap" disabled={isLoading}>
                  {isLoading ? (
                    <><Spinner as="span" animation="border" size="sm" className="me-2" />Resetting...</>
                  ) : (
                    <><CsLineIcons icon="check" size="17" className="me-2" />Reset Password</>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="login-auth-footer-link">
            Remember your password? <NavLink to="/login">Sign In →</NavLink>
          </div>

          <div className="login-auth-powered">
            Powered by <strong><a href="https://theboxsync.com" target="_blank" rel="noopener noreferrer">TheBoxSync</a></strong>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
