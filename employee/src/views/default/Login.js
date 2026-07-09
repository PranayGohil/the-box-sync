import React, { useState, useContext, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import axios from 'axios';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import { AuthContext } from 'contexts/AuthContext';

const Login = () => {
  const { isLogin } = useSelector((state) => state.auth);

  if (isLogin) {
    return <Redirect to="/dashboard" />;
  }

  const title = 'Login — Employee Panel';
  const description = 'Employee self-service portal — sign in with your email OTP.';

  const { login } = useContext(AuthContext);
  const [step, setStep] = useState(1); // 1 = email, 2 = OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef([]);

  // ── Resend cooldown ──────────────────────────────────────────────────────
  // Defined first so handleSendOtp can reference it without no-use-before-define
  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/kiosk/send-otp`, { email: email.trim() });
      setSuccess(res.data.message || 'OTP sent! Check your inbox.');
      setStep(2);
      startResendCooldown();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    if (e) { e.preventDefault(); }
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/kiosk/verify-otp`, {
        email: email.trim(),
        otp: otpValue,
      });
      if (res.data.message === 'Logged In') {
        login(res.data.token, res.data.user);
        window.location.href = '/dashboard';
      } else {
        setError(res.data.message || 'Verification failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── OTP Input handlers ────────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all 6 digits filled
    if (value && updated.every((d) => d !== '')) {
      handleVerifyOtp();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setError('');
    setSuccess('');
    setOtp(['', '', '', '', '', '']);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API}/kiosk/send-otp`, { email: email.trim() });
      setSuccess('OTP resent! Check your inbox.');
      startResendCooldown();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <HtmlHead title={title} description={description} />

      <style>{`
        .emp-login-wrapper {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #0f172a;
        }

        /* ── Left Panel ── */
        .emp-login-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 48px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0c4a6e 100%);
          position: relative;
          overflow: hidden;
        }
        .emp-login-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 30% 50%, rgba(35,179,244,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .emp-login-brand {
          font-size: 1.2rem;
          font-weight: 800;
          color: #23b3f4;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 40px;
        }
        .emp-login-brand span { color: #fff; }
        .emp-login-hero-title {
          font-size: clamp(1.8rem, 3.5vw, 2.8rem);
          font-weight: 800;
          color: #fff;
          line-height: 1.2;
          margin-bottom: 20px;
        }
        .emp-login-hero-title span { color: #23b3f4; }
        .emp-login-hero-sub {
          color: #94a3b8;
          font-size: 0.95rem;
          line-height: 1.7;
          max-width: 420px;
          margin-bottom: 40px;
        }
        .emp-login-pills { display: flex; flex-wrap: wrap; gap: 10px; }
        .emp-login-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(35,179,244,0.1);
          border: 1px solid rgba(35,179,244,0.2);
          color: #e2e8f0;
          padding: 7px 14px;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 500;
        }
        .emp-login-pill-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #23b3f4;
          flex-shrink: 0;
        }

        /* ── Right Panel ── */
        .emp-login-right {
          width: 480px;
          min-height: 100vh;
          background: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 44px;
        }
        .emp-login-eyebrow {
          font-size: 0.75rem;
          font-weight: 700;
          color: #23b3f4;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .emp-login-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .emp-login-subtitle {
          color: #64748b;
          font-size: 0.9rem;
          margin-bottom: 32px;
        }

        /* Alert */
        .emp-alert-error {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 0.875rem;
          margin-bottom: 20px;
        }
        .emp-alert-success {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #16a34a;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 0.875rem;
          margin-bottom: 20px;
        }

        /* Inputs */
        .emp-input-group { margin-bottom: 20px; }
        .emp-input-label {
          display: block;
          font-size: 0.825rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 7px;
        }
        .emp-input-wrap { position: relative; }
        .emp-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }
        .emp-input {
          width: 100%;
          padding: 13px 16px 13px 44px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.9rem;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .emp-input:focus {
          border-color: #23b3f4;
          box-shadow: 0 0 0 3px rgba(35,179,244,0.12);
          background: #fff;
        }

        /* OTP grid */
        .emp-otp-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
          margin-bottom: 8px;
        }
        .emp-otp-box {
          aspect-ratio: 1;
          text-align: center;
          font-size: 1.4rem;
          font-weight: 700;
          color: #0f172a;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          outline: none;
          background: #f8fafc;
          transition: border-color 0.2s, box-shadow 0.2s;
          padding: 0;
        }
        .emp-otp-box:focus {
          border-color: #23b3f4;
          box-shadow: 0 0 0 3px rgba(35,179,244,0.12);
          background: #fff;
        }
        .emp-otp-box.filled {
          border-color: #10b981;
          background: #f0fdf4;
        }

        /* Primary Button */
        .emp-btn-primary {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #23b3f4 0%, #0284c7 100%);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.2s, transform 0.15s;
          margin-top: 4px;
        }
        .emp-btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .emp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Back link */
        .emp-back-link {
          background: none;
          border: none;
          color: #64748b;
          font-size: 0.85rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0;
          margin-bottom: 28px;
          transition: color 0.2s;
        }
        .emp-back-link:hover { color: #0f172a; }

        /* Resend */
        .emp-resend-row {
          text-align: center;
          font-size: 0.85rem;
          color: #64748b;
          margin-top: 16px;
        }
        .emp-resend-btn {
          background: none;
          border: none;
          color: #23b3f4;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          font-size: 0.85rem;
        }
        .emp-resend-btn:disabled { color: #94a3b8; cursor: default; }

        .emp-powered {
          text-align: center;
          font-size: 0.78rem;
          color: #94a3b8;
          margin-top: 40px;
        }
        .emp-powered strong { color: #64748b; }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .emp-login-left { display: none; }
          .emp-login-right { width: 100%; padding: 40px 28px; }
        }
      `}</style>

      <div className="emp-login-wrapper">
        {/* ── Left Branding Panel ── */}
        <div className="emp-login-left">
          <div className="emp-login-brand">THE <span>BOX</span></div>
          <h1 className="emp-login-hero-title">
            Your Work,<br />
            <span>All in One Place.</span>
          </h1>
          <p className="emp-login-hero-sub">
            Access your payslips, attendance records, leave requests, and salary details — all from your Employee Self-Service portal.
          </p>
          <div className="emp-login-pills">
            {['Payslip Downloads', 'Leave Requests', 'Attendance History', 'OTP Secured Login'].map((f) => (
              <div key={f} className="emp-login-pill">
                <div className="emp-login-pill-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Form Panel ── */}
        <div className="emp-login-right">
          {step === 1 ? (
            <>
              <div className="emp-login-eyebrow">Employee Panel</div>
              <h2 className="emp-login-title">Sign In</h2>
              <p className="emp-login-subtitle">Enter your registered email to receive a one-time password.</p>

              {error && (
                <div className="emp-alert-error">
                  <CsLineIcons icon="warning-hexagon" size={18} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSendOtp}>
                <div className="emp-input-group">
                  <label className="emp-input-label">Email Address</label>
                  <div className="emp-input-wrap">
                    <span className="emp-input-icon">
                      <CsLineIcons icon="email" size={18} />
                    </span>
                    <input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="emp-input"
                      autoFocus
                    />
                  </div>
                </div>

                <button type="submit" className="emp-btn-primary" disabled={isLoading}>
                  {isLoading ? (
                    <><Spinner as="span" animation="border" size="sm" /> Sending OTP...</>
                  ) : (
                    <><CsLineIcons icon="send" size={17} /> Send OTP</>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <button type="button" className="emp-back-link" onClick={() => { setStep(1); setError(''); setSuccess(''); setOtp(['','','','','','']); }}>
                <CsLineIcons icon="arrow-left" size={15} /> Back
              </button>

              <div className="emp-login-eyebrow">Verification</div>
              <h2 className="emp-login-title">Enter OTP</h2>
              <p className="emp-login-subtitle">
                A 6-digit code was sent to <strong style={{ color: '#0f172a' }}>{email}</strong>. It expires in 10 minutes.
              </p>

              {error && (
                <div className="emp-alert-error">
                  <CsLineIcons icon="warning-hexagon" size={18} />
                  {error}
                </div>
              )}
              {success && (
                <div className="emp-alert-success">
                  <CsLineIcons icon="check" size={18} />
                  {success}
                </div>
              )}

              <form onSubmit={handleVerifyOtp}>
                <div className="emp-otp-grid" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      disabled={isLoading}
                      className={`emp-otp-box${digit ? ' filled' : ''}`}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <button type="submit" className="emp-btn-primary" disabled={isLoading || otp.some((d) => d === '')}>
                  {isLoading ? (
                    <><Spinner as="span" animation="border" size="sm" /> Verifying...</>
                  ) : (
                    <><CsLineIcons icon="login" size={17} /> Verify & Sign In</>
                  )}
                </button>
              </form>

              <div className="emp-resend-row">
                Didn't receive it?{' '}
                <button
                  type="button"
                  className="emp-resend-btn"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isLoading}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </>
          )}

          <div className="emp-powered">
            Powered by <strong>TheBoxSync</strong>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
