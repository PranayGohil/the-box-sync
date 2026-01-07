import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import axios from 'axios';
import { Card, Col, Row, Button, Form, Alert, Spinner } from 'react-bootstrap';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import LayoutFullpage from 'layout/LayoutFullpage';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const title = 'Forgot Password';
  const description = 'Reset your admin password';

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: OTP, Step 2: Change Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API}/user/send-otp`, { email });
      setSuccess(response.data.message);
      setError('');
      setStep(2); // Move to the next step
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred.');
      setSuccess('');
      toast.error(err.response?.data?.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API}/user/verify-otp`, { email, otp });
      if (!response.data.verified) {
        throw new Error('OTP verification failed.');
      } else {
        setSuccess(response.data.message);
        setError('');
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP.');
      setSuccess('');
      toast.error(err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    setIsLoading(true);

    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Password do not match.');
      setSuccess('');
      setIsLoading(false);
      return;
    }
    try {
      const response = await axios.post(`${process.env.REACT_APP_API}/user/reset-password`, { email, newPassword });
      setSuccess(response.data.message);
      setError('');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred.');
      setSuccess('');
      toast.error(err.response?.data?.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const stepHeader = {
    1: {
      title: 'Forgot your password?',
      subtitle: 'No worries — we’ll help you reset it.',
    },
    2: {
      title: 'Verify your OTP',
      subtitle: 'Almost there — let’s confirm it’s you.',
    },
    3: {
      title: 'Reset your Password',
      subtitle: 'Create a new password to secure your account.',
    },
  };

  const leftSide = (
    <div className="min-h-100 d-flex align-items-center">
      <div className="w-100 w-lg-75 w-xxl-50" />
    </div>
  );

  const rightSide = (
    <div className="sw-lg-70 min-h-100 bg-foreground d-flex justify-content-center align-items-center shadow-deep py-5 full-page-content-right-border">
      <div className="sw-lg-50 px-5 d-flex flex-column min-h-100 mx-auto">

        {/* CENTER CONTENT */}
        <div className="my-auto">

          {/* HEADER — CHANGES BASED ON STEP */}
          <div className="mb-4">
            <h2 className="cta-1 mb-0 text-primary">
              {stepHeader[step].title}
            </h2>
            <p className="h6 mt-2">
              {stepHeader[step].subtitle}
            </p>
          </div>


          {/* STEP 1 */}
          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <div className="mb-3 filled form-group tooltip-end-top">
                <CsLineIcons icon="email" />
                <Form.Control
                  type="email"
                  placeholder="Email"
                  value={email}
                  disabled={isLoading}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && <div className="text-danger mb-2">{error}</div>}
              {success && <div className="text-success mb-2">{success}</div>}

              <div className="d-flex justify-content-between align-items-center">
                <Button size="lg" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Sending...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </Button>
                <NavLink to="/login" className="justify-content-left" >
                  <Button size="lg" type="submit" className="btn btn-primary">
                    Login
                  </Button>
                </NavLink>
              </div>
            </form>
          )}

          {/* STEP 2 */}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <div className="mb-3 filled form-group tooltip-end-top">
                <CsLineIcons icon="key" />
                <Form.Control
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  disabled={isLoading}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              {error && <div className="text-danger mb-2">{error}</div>}

              <div className="d-flex justify-content-between align-items-center">
                <Button size="lg" type="submit" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>

                <Button className="btn btn-primary" onClick={() => setStep(1)}>
                  Back
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="mb-3 filled form-group tooltip-end-top">
                <CsLineIcons icon="lock-off" />
                <Form.Control
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  disabled={isLoading}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="mb-3 filled form-group tooltip-end-top">
                <CsLineIcons icon="lock-off" />
                <Form.Control
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  disabled={isLoading}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {error && <div className="text-danger mb-2">{error}</div>}

              <div className="d-flex justify-content-between align-items-center">
                <Button size="lg" type="submit" disabled={isLoading}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>

                <Button className="btn btn-primary" onClick={() => setStep(2)}>
                  Back
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* FOOTER */}
        <div className="mt-auto text-center pt-4">
          <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>
            Powered by <strong>TheBoxSync</strong>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <HtmlHead title={title} description={description} />
      <LayoutFullpage left={leftSide} right={rightSide} />
    </>
  );
};

export default ForgotPassword;
