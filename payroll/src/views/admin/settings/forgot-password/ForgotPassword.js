import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, Col, Row, Button, Form, Alert, Spinner } from 'react-bootstrap';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import HtmlHead from 'components/html-head/HtmlHead';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import { toast } from 'react-toastify';

const customStyles = `
    .glass-card {
      background: rgba(255, 255, 255, 0.95) !important;
      backdrop-filter: blur(10px) !important;
      border-radius: 1.25rem !important;
      border: 1px solid rgba(255, 255, 255, 0.4) !important;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07) !important;
      transition: all 0.3s ease !important;
      border: none !important;
    }
    .glass-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.12) !important;
    }
    .custom-btn-solid {
      background: #1ea8e7 !important;
      border: 1px solid #1ea8e7 !important;
      color: #ffffff !important;
      border-radius: 50px !important;
      padding: 0.6rem 1.5rem !important;
      font-weight: 600 !important;
      transition: all 0.3s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
    }
    .custom-btn-solid:hover {
      background: #0091d5 !important;
      border-color: #0091d5 !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(30, 168, 231, 0.3) !important;
    }
    .custom-btn-outline {
      background: #ffffff !important;
      border: 1px solid #1ea8e7 !important;
      color: #1ea8e7 !important;
      border-radius: 50px !important;
      padding: 0.5rem 1.2rem !important;
      font-weight: 600 !important;
      transition: all 0.3s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05) !important;
      text-decoration: none !important;
    }
    .custom-btn-outline:hover {
      background: #1ea8e7 !important;
      color: #ffffff !important;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(30, 168, 231, 0.2) !important;
    }
    .custom-btn-outline svg {
      color: inherit !important;
      fill: none !important;
      stroke: currentColor !important;
      stroke-width: 2px !important;
    }
    .pill-input {
      border-radius: 12px !important;
      padding: 0.6rem 1rem !important;
      border: 1px solid #e5e7eb !important;
      background: #ffffff !important;
      transition: all 0.2s ease !important;
    }
    .pill-input:focus {
      border-color: #1ea8e7 !important;
      box-shadow: 0 0 0 4px rgba(30, 168, 231, 0.1) !important;
      outline: none !important;
    }
    .premium-header {
      background: linear-gradient(135deg, #1ea8e7 0%, #0091d5 100%) !important;
      color: white !important;
      border-radius: 1.25rem 1.25rem 0 0 !important;
      padding: 1.5rem !important;
      border: none !important;
    }
  `;

function ForgotPassword() {
  const title = 'Forgot Password';
  const description = 'Reset your admin password';

  const breadcrumbs = [
    { to: '', text: 'Home' },
    { to: 'forgot-password', text: 'Forgot Password' },
  ];

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: OTP, Step 2: Change Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${process.env.REACT_APP_API}/user/send-otp`, { email });
      setSuccess(response.data.message);
      setStep(2); // Move to the next step
      toast.success('OTP sent successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to send OTP. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
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
        setSuccess(response.data.message);
        setStep(3);
        toast.success('OTP verified successfully!');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Invalid OTP. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setSuccess('');
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${process.env.REACT_APP_API}/user/reset-password`, { email, newPassword });
      setSuccess(response.data.message);
      toast.success('Password reset successfully! Redirecting to login...');

      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{customStyles}</style>
      <HtmlHead title={title} description={description} />
      <div className="page-title-container mb-4">
        <h1 className="mb-0 pb-0 display-4 fw-bold" style={{ color: '#1ea8e7' }}>{title}</h1>
        <BreadcrumbList items={breadcrumbs} />
      </div>

      <Row className="justify-content-center">
        <Col xs={12} lg={8} xl={5}>
          <Card className="glass-card border-0 mb-5 overflow-hidden">
            <div className="premium-header">
              <h5 className="mb-0 d-flex align-items-center fw-bold">
                <CsLineIcons icon="lock-off" className="me-3" stroke="white" size="22" />
                {step === 1 && 'Enter Your Email'}
                {step === 2 && 'Verify OTP'}
                {step === 3 && 'Reset Password'}
              </h5>
            </div>
            <Card.Body className="p-4">
              <p className="text-muted mb-4 small">
                {step === 1 && 'Enter your email address to receive a verification OTP.'}
                {step === 2 && 'Check your email for the OTP and enter it below.'}
                {step === 3 && 'Enter your new password and confirm it.'}
              </p>

              {error && <Alert variant="danger" className="rounded-xl border-0 shadow-sm">{error}</Alert>}
              {success && <Alert variant="success" className="rounded-xl border-0 shadow-sm">{success}</Alert>}

              {step === 1 && (
                <Form onSubmit={handleSendOtp}>
                  <Form.Group className="mb-4">
                    <Form.Label className="small fw-bold text-muted">Email Address</Form.Label>
                    <Form.Control
                      className="pill-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email"
                      disabled={isLoading}
                    />
                  </Form.Group>
                  <div className="d-flex justify-content-between align-items-center">
                    <Button className="custom-btn-solid" type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send OTP
                        </>
                      )}
                    </Button>
                    <Link to="/login" className="custom-btn-outline px-4 py-2" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
                      <CsLineIcons icon="arrow-left" className="me-2" size="15" />
                      Back
                    </Link>
                  </div>
                </Form>
              )}

              {step === 2 && (
                <Form onSubmit={handleVerifyOtp}>
                  <Form.Group className="mb-4">
                    <Form.Label className="small fw-bold text-muted">Verification OTP</Form.Label>
                    <Form.Control
                      className="pill-input"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      placeholder="Enter the OTP sent to your email"
                      disabled={isLoading}
                    />
                    <Form.Text className="text-muted small mt-2 d-block">
                      OTP is valid for 10 minutes
                    </Form.Text>
                  </Form.Group>
                  <div className="d-flex justify-content-between align-items-center">
                    <Button className="custom-btn-solid" type="submit" disabled={isLoading} style={{ minWidth: '140px' }}>
                      {isLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CsLineIcons icon="check" className="me-2" size="18" stroke="white" />
                          Verify OTP
                        </>
                      )}
                    </Button>
                    <Button variant="none" className="custom-btn-outline" onClick={() => setStep(1)} disabled={isLoading}>
                      <CsLineIcons icon="arrow-left" className="me-2" size="15" />
                      Back
                    </Button>
                  </div>
                </Form>
              )}

              {step === 3 && (
                <Form onSubmit={handleResetPassword}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">New Password</Form.Label>
                    <Form.Control
                      className="pill-input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Enter your new password"
                      disabled={isLoading}
                    />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Label className="small fw-bold text-muted">Confirm New Password</Form.Label>
                    <Form.Control
                      className="pill-input"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm your new password"
                      disabled={isLoading}
                    />
                  </Form.Group>
                  <div className="d-flex justify-content-between align-items-center">
                    <Button className="custom-btn-solid" type="submit" disabled={isLoading} style={{ minWidth: '160px' }}>
                      {isLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Resetting...
                        </>
                      ) : (
                        <>
                          <CsLineIcons icon="lock-on" className="me-2" size="18" stroke="white" />
                          Reset Password
                        </>
                      )}
                    </Button>
                    <Button variant="none" className="custom-btn-outline" onClick={() => setStep(2)} disabled={isLoading}>
                      <CsLineIcons icon="arrow-left" className="me-2" size="15" />
                      Back
                    </Button>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}

export default ForgotPassword;