import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

function RaiseInquiryModal({ show, handleClose, subscriptionName, fetchData }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const validationSchema = Yup.object().shape({
        message: Yup.string().required('Message is required'),
    });

    const {
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        handleSubmit,
        resetForm,
    } = useFormik({
        initialValues: {
            message: '',
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: async (formValues) => {
            setIsLoading(true);
            setError('');
            try {
                await axios.post(
                    `${process.env.REACT_APP_API}/customerquery/addquery`,
                    {
                        message: formValues.message,
                        purpose: `Against Blocked Subscription: ${subscriptionName}`,
                    },
                    { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                );

                toast.success('Inquiry raised successfully!');
                fetchData?.();
                handleClose();
            } catch (err) {
                console.error('Error raising inquiry:', err);
                setError(err.response?.data?.message || 'Failed to send inquiry. Try again.');
                toast.error('Failed to send inquiry. Try again.');
            } finally {
                setIsLoading(false);
            }
        },
    });

    useEffect(() => {
        if (!show) {
            resetForm();
            setError('');
        }
    }, [show, resetForm]);

    const renderError = (field) =>
        touched[field] && errors[field] ? (
            <div className="text-danger mt-1" style={{ fontSize: '0.875em' }}>
                {errors[field]}
            </div>
        ) : null;

    return (
        <>
            <Modal className="modal-right large fade" show={show} onHide={handleClose} backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <CsLineIcons icon="send" className="me-2" />
                        Raise Inquiry
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form noValidate>
                        <Form.Group controlId="inquiryMessage" className="mb-3">
                            <Form.Label>Your Message</Form.Label>
                            <Form.Control
                                as="textarea"
                                name="message"
                                rows={4}
                                value={values.message}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={touched.message && !!errors.message}
                                placeholder="Describe your issue…"
                                disabled={isLoading}
                            />
                            {renderError('message')}
                        </Form.Group>

                        {error && (
                            <Alert variant="danger" className="mt-3">
                                <CsLineIcons icon="error" className="me-2" />
                                {error}
                            </Alert>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-primary" onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={isLoading || !values.message.trim()}
                        style={{ minWidth: '120px' }}
                    >
                        {isLoading ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Sending...
                            </>
                        ) : 'Send Inquiry'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Sending overlay */}
            {isLoading && (
                <div
                    className="position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center"
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        zIndex: 9999,
                        backdropFilter: 'blur(2px)'
                    }}
                >
                    <div className="card shadow-lg border-0" style={{ minWidth: '200px' }}>
                        <div className="card-body text-center p-4">
                            <Spinner
                                animation="border"
                                variant="primary"
                                className="mb-3"
                                style={{ width: '3rem', height: '3rem' }}
                            />
                            <h5 className="mb-0">Sending Inquiry...</h5>
                            <small className="text-muted">Please wait a moment</small>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default RaiseInquiryModal;