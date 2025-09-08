import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Card, Col, Row, Button, Form, Alert, Spinner } from "react-bootstrap";
import BreadcrumbList from "components/breadcrumb-list/BreadcrumbList";
import HtmlHead from "components/html-head/HtmlHead";
import CsLineIcons from "cs-line-icons/CsLineIcons";

function ForgotPassword() {
    const title = 'Forgot Password';
    const description = 'Reset your admin password';

    const breadcrumbs = [
        { to: '', text: 'Home' },
        { to: 'forgot-password', text: 'Forgot Password' },
    ];

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
                window.location.href = "/login"; // Redirect to the admin login page
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.message || "An error occurred.");
            setSuccess("");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <HtmlHead title={title} description={description} />
            <div className="page-title-container">
                <h1 className="mb-0 pb-0 display-4">{title}</h1>
                <BreadcrumbList items={breadcrumbs} />
            </div>
            <Row className="justify-content-center">
                <Col xs={12} lg={8} xl={6}>

                    <Card className="mb-5">
                        <Card.Header>
                            <Card.Title className="mb-0">
                                {step === 1 && "Enter Your Email"}
                                {step === 2 && "Verify OTP"}
                                {step === 3 && "Reset Password"}
                            </Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <p className="text-muted mb-4">
                                {step === 1 && "Enter your email address to receive a verification OTP."}
                                {step === 2 && "Check your email for the OTP and enter it below."}
                                {step === 3 && "Enter your new password and confirm it."}
                            </p>

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
                                            variant="outline-secondary"
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
                                            variant="outline-secondary"
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
                </Col>
            </Row>
        </>
    );
}

export default ForgotPassword;