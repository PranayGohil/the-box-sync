import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';

function RaiseInquiryModal({ show, handleClose, subscriptionName, fetchData }) {
    const [isLoading, setIsLoading] = useState(false);

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
            try {
                await axios.post(
                    `${process.env.REACT_APP_API}/customerquery/addquery`,
                    {
                        message: formValues.message,
                        purpose: `Against Blocked Subscription: ${subscriptionName}`,
                    },
                    { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                );

                fetchData?.();
                handleClose();
            } catch (err) {
                console.error('Error raising inquiry:', err);
                toast.error('Failed to send inquiry. Try again.');
            } finally {
                setIsLoading(false);
            }
        },
    });

    useEffect(() => {
        if (!show) {
            resetForm();
        }
    }, [show, resetForm]);

    const renderError = (field) =>
        touched[field] && errors[field] ? (
            <div className="text-danger mt-1" style={{ fontSize: '0.875em' }}>
                {errors[field]}
            </div>
        ) : null;

    return ( 
        <Modal className="modal-right large fade" show={show} onHide={handleClose} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Raise Inquiry</Modal.Title>
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
                        />
                        {renderError('message')}
                    </Form.Group>
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
                >
                    {isLoading ? 'Sending…' : 'Send Inquiry'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default RaiseInquiryModal;
