import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import axios from 'axios';
import { Card, Col, Row, Button, Form, Alert, Spinner } from "react-bootstrap";
import * as Yup from 'yup';
import { useFormik } from 'formik';
import LayoutFullpage from 'layout/LayoutFullpage';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import HtmlHead from 'components/html-head/HtmlHead';

const ForgotPassword = () => {
  const title = 'Forgot Password';
  const description = 'Reset your admin password';

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: OTP, Step 2: Change Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendOtp = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}/user/send-otp`,
        { email }
      );
      setSuccess(response.data.message);
      setError("");
      setStep(2); // Move to the next step
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred.");
      setSuccess("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}/user/verify-otp`,
        { email, otp }
      );
      setSuccess(response.data.message);
      setError("");
      setStep(3); // Move to the password reset step
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP.");
      setSuccess("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {

    setIsLoading(true);

    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setSuccess("");
      setIsLoading(false);
      return;
    }
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}/user/reset-password`,
        { email, newPassword }
      );
      setSuccess(response.data.message);
      setError("");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred.");
      setSuccess("");
    } finally {
      setIsLoading(false);
    }
  };

  const leftSide = (
    <div className="min-h-100 d-flex align-items-center">
      <div className="w-100 w-lg-75 w-xxl-50" />
    </div>
  );

  const rightSide = (
    <div className="sw-lg-70 min-h-100 bg-foreground d-flex justify-content-center align-items-center shadow-deep py-5 full-page-content-right-border">
      <div className="sw-lg-50 px-5">
        <div className="sh-11">
          <NavLink to="/">
            <div className="logo-default" />
          </NavLink>
        </div>
        <div className="mb-5">
          <h2 className="cta-1 mb-0 text-primary">Password is gone?</h2>
          <h2 className="cta-1 text-primary">Let's reset it!</h2>
        </div>
        <div>
          <Card className="mb-5">
            <Card.Header>
              <Card.Title className="mb-0">
                {step === 1 && "Enter Your Email"}
                {step === 2 && "Verify OTP"}
                {step === 3 && "Reset Password"}
              </Card.Title>
            </Card.Header>
            <Card.Body>
              {/* <p className="text-muted mb-4">
                {step === 1 && "Enter your email address to receive a verification OTP."}
                {step === 2 && "Check your email for the OTP and enter it below."}
                {step === 3 && "Enter your new password and confirm it."}
              </p> */}

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              {step === 1 && (
                <Form onSubmit={handleSendOtp}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email"
                    />
                  </Form.Group>
                  <div className="d-flex justify-content-between align-items-center">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <CsLineIcons icon="send" className="me-2" />
                          Send OTP
                        </>
                      )}
                    </Button>
                    <Link to="/login" className="text-muted">
                      <CsLineIcons icon="arrow-left" className="me-1" />
                      Back to Login
                    </Link>
                  </div>
                </Form>
              )}

              {step === 2 && (
                <Form onSubmit={handleVerifyOtp}>
                  <Form.Group className="mb-3">
                    <Form.Label>Verification OTP</Form.Label>
                    <Form.Control
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      placeholder="Enter the OTP sent to your email"
                    />
                  </Form.Group>
                  <div className="d-flex justify-content-between align-items-center">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CsLineIcons icon="check" className="me-2" />
                          Verify OTP
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline-secondary mx-3"
                      onClick={() => setStep(1)}
                    >
                      <CsLineIcons icon="arrow-left" className="me-1" />
                      Change Email
                    </Button>
                  </div>
                </Form>
              )}

              {step === 3 && (
                <Form onSubmit={handleResetPassword}>
                  <Form.Group className="mb-3">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Enter your new password"
                    />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Label>Confirm New Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm your new password"
                    />
                  </Form.Group>
                  <div className="d-flex justify-content-between align-items-center">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Resetting...
                        </>
                      ) : (
                        <>
                          <CsLineIcons icon="lock" className="me-2" />
                          Reset Password
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline-secondary mx-3"
                      onClick={() => setStep(2)}
                    >
                      <CsLineIcons icon="arrow-left" className="me-1" />
                      Back to OTP
                    </Button>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
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
