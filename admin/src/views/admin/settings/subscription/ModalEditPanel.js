import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const customStyles = `
  .btn-pill-outline {
    border: 1px solid #1ea8e7 !important;
    color: #1ea8e7 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    padding: 0.6rem 1.5rem !important;
    font-weight: 600 !important;
    width: auto !important;
    height: auto !important;
  }
  .btn-pill-outline:hover {
    background-color: #1ea8e7 !important;
    color: #fff !important;
  }
  .btn-pill-outline:hover svg {
    stroke: #fff !important;
  }
  .modal-footer {
    display: flex !important;
    flex-direction: row !important;
    justify-content: flex-end !important;
    gap: 0.75rem !important;
  }
`;

function ModalEditPanel({ show, handleClose, data, planName, onSave }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const isAddMode = !data?._id;

  const validationSchema = Yup.object().shape({
    username: Yup.string().required('Username is required'),
    adminPassword: isAddMode || showPasswordFields
      ? Yup.string().required('Admin password is required')
      : Yup.string(),
    newPassword: isAddMode || showPasswordFields
      ? Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required')
      : Yup.string(),
    confirmPassword: isAddMode || showPasswordFields
      ? Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
        .required('Please confirm your password')
      : Yup.string(),
  });

  const formik = useFormik({
    initialValues: {
      username: data?.username || '',
      adminPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (formValues) => {
      setIsLoading(true);
      setError(null);
      try {
        if (isAddMode) {
          await axios.post(
            `${process.env.REACT_APP_API}/panel-user/${planName}`,
            {
              username: formValues.username,
              password: formValues.newPassword,
              adminPassword: formValues.adminPassword,
            },
            {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            }
          );
          toast.success('Panel user created successfully!');
        } else {
          if (showPasswordFields) {
            await axios.post(
              `${process.env.REACT_APP_API}/panel-user/change-password/${planName}`,
              {
                adminPassword: formValues.adminPassword,
                newPassword: formValues.newPassword,
              },
              {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              }
            );
            toast.success('Password updated successfully!');
          }

          await axios.post(
            `${process.env.REACT_APP_API}/panel-user/${planName}`,
            {
              username: formValues.username,
            },
            {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            }
          );
          toast.success('Panel user updated successfully!');
        }

        onSave({ username: formValues.username });
        setShowPasswordFields(false);
        handleClose();
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Something went wrong');
        toast.error(err.response?.data?.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    },
  });

  useEffect(() => {
    if (!show) {
      formik.resetForm();
      setShowPasswordFields(false);
      setError(null);
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
      <style>{customStyles}</style>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold" style={{ color: '#1ea8e7' }}>
          {isAddMode ? 'Add' : 'Edit'} {planName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        <Form id="edit_panel_form" onSubmit={formik.handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Username</Form.Label>
            <Form.Control
              type="text"
              name="username"
              placeholder="Enter username"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={isLoading}
              className="shadow-sm"
            />
            {renderError('username')}
          </Form.Group>

          {isAddMode && (
            <>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Admin Password</Form.Label>
                <Form.Control
                  type="password"
                  name="adminPassword"
                  placeholder="Your admin password"
                  value={formik.values.adminPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={isLoading}
                  className="shadow-sm"
                />
                {renderError('adminPassword')}
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Panel Password</Form.Label>
                <Form.Control
                  type="password"
                  name="newPassword"
                  placeholder="Set panel password"
                  value={formik.values.newPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={isLoading}
                  className="shadow-sm"
                />
                {renderError('newPassword')}
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm panel password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={isLoading}
                  className="shadow-sm"
                />
                {renderError('confirmPassword')}
              </Form.Group>
            </>
          )}

          {!isAddMode && !showPasswordFields && (
            <Button
              variant="none"
              className="btn-pill-outline w-100 d-flex justify-content-center align-items-center mb-3"
              onClick={() => setShowPasswordFields(true)}
              disabled={isLoading}
            >
              <CsLineIcons icon="lock" size="18" className="me-2" />
              Change Password
            </Button>
          )}

          {!isAddMode && showPasswordFields && (
            <>
              <hr className="my-4 opacity-10" />
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Admin Password</Form.Label>
                <Form.Control
                  type="password"
                  name="adminPassword"
                  placeholder="Your admin password"
                  value={formik.values.adminPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={isLoading}
                  className="shadow-sm"
                />
                {renderError('adminPassword')}
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">New Panel Password</Form.Label>
                <Form.Control
                  type="password"
                  name="newPassword"
                  placeholder="Set new panel password"
                  value={formik.values.newPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={isLoading}
                  className="shadow-sm"
                />
                {renderError('newPassword')}
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Confirm New Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={isLoading}
                  className="shadow-sm"
                />
                {renderError('confirmPassword')}
              </Form.Group>
            </>
          )}

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
          onClick={handleClose} 
          disabled={isLoading}
          className="rounded-pill px-4 fw-bold btn-pill-outline"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="edit_panel_form"
          disabled={isLoading}
          className="rounded-pill px-4 fw-bold btn-pill-outline"
        >
          {isLoading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            <div className="d-flex align-items-center">
              <CsLineIcons icon="save" size="18" className="me-2" />
              Save Credentials
            </div>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ModalEditPanel;