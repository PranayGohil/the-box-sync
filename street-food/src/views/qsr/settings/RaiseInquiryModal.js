import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

function RaiseInquiryModal({ show, handleClose, subscriptionName, fetchData, isAddonInquiry, currentUser }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validationSchema = Yup.object().shape({
    message: Yup.string().required('Message is required'),
  });

  const formik = useFormik({
    initialValues: {
      message: '',
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (formValues) => {
      setIsLoading(true);
      setError('');
      try {
        if (isAddonInquiry && currentUser) {
          await axios.post(
            `${process.env.REACT_APP_API}/inquiry/create`,
            {
              name: currentUser.name || currentUser.first_name || '',
              email: currentUser.email || '',
              phone: currentUser.phone || currentUser.mobile || '',
              city: currentUser.city || '',
              restaurant_name: currentUser.restaurant_name || currentUser.name || '',
              purpose: `Excluded Addon: ${subscriptionName}`,
              message: formValues.message,
            },
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
          );
        } else {
          await axios.post(
            `${process.env.REACT_APP_API}/customerquery/addquery`,
            {
              message: formValues.message,
              purpose: `Against Blocked Subscription: ${subscriptionName}`,
            },
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
          );
        }

        toast.success('Inquiry raised successfully!');
        fetchData?.();
        handleClose();
      } catch (err) {
        console.error('Error raising inquiry:', err);
        setError(err.response?.data?.message || 'Failed to inquiry: Please try again later.');
        toast.error('Failed to inquiry: Please try again later.');
      } finally {
        setIsLoading(false);
      }
    },
  });

  useEffect(() => {
    if (!show) {
      formik.resetForm();
      setError('');
    }
  }, [show]);

  const renderError = (field) =>
    formik.touched[field] && formik.errors[field] ? (
      <div className="text-danger mt-1 small fw-bold">
        {formik.errors[field]}
      </div>
    ) : null;

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold" style={{ color: '#1ea8e7' }}>
          Raise Support Inquiry
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        <Form id="raise_inquiry_form" onSubmit={formik.handleSubmit}>
          <p className="small text-muted mb-4">
            You are raising an inquiry for: <strong>{subscriptionName}</strong>
          </p>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Detailed Message</Form.Label>
            <Form.Control
              as="textarea"
              name="message"
              rows={4}
              placeholder="Describe your request in detail..."
              value={formik.values.message}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              isInvalid={formik.touched.message && !!formik.errors.message}
              disabled={isLoading}
              className="shadow-sm"
              style={{ resize: 'none' }}
            />
            {renderError('message')}
          </Form.Group>

          {error && (
            <Alert variant="danger" className="mt-3 border-0 shadow-sm small fw-bold">
              <CsLineIcons icon="error" size="18" className="me-2" />
              {error}
            </Alert>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button 
          variant="outline-secondary"
          onClick={handleClose} 
          disabled={isLoading}
          className="rounded-pill px-4 fw-bold"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="raise_inquiry_form"
          disabled={isLoading || !formik.values.message.trim()}
          className="rounded-pill px-4 fw-bold btn-primary"
        >
          {isLoading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Sending...
            </>
          ) : (
            <div className="d-flex align-items-center">
              <CsLineIcons icon="send" size="18" className="me-2" stroke="currentColor" />
              Submit Inquiry
            </div>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default RaiseInquiryModal;
