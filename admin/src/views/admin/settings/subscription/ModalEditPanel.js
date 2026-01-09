import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

function ModalEditPanel({ show, handleClose, data, planName, onSave }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const isAddMode = !data?._id;

  // Dynamic Yup validation schema
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

  const {
    values,
    handleSubmit,
    handleChange,
    resetForm,
    errors,
    touched,
    handleBlur,
    setFieldTouched,
  } = useFormik({
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
      resetForm();
      setShowPasswordFields(false);
      setError(null);
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
            {isAddMode ? 'Add' : 'Edit'} {planName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form noValidate>
            <div className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={values.username}
                onChange={handleChange}
                onBlur={handleBlur}
                isInvalid={touched.username && !!errors.username}
                disabled={isLoading}
              />
              {renderError('username')}
            </div>

            {isAddMode && (
              <>
                <div className="mb-3">
                  <Form.Label>Admin Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="adminPassword"
                    value={values.adminPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.adminPassword && !!errors.adminPassword}
                    disabled={isLoading}
                  />
                  {renderError('adminPassword')}
                </div>
                <div className="mb-3">
                  <Form.Label>Panel Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="newPassword"
                    value={values.newPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.newPassword && !!errors.newPassword}
                    disabled={isLoading}
                  />
                  {renderError('newPassword')}
                </div>
                <div className="mb-3">
                  <Form.Label>Confirm Panel Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.confirmPassword && !!errors.confirmPassword}
                    disabled={isLoading}
                  />
                  {renderError('confirmPassword')}
                </div>
              </>
            )}

            {!isAddMode && !showPasswordFields && (
              <Button
                variant="outline-warning"
                size="sm"
                onClick={() => setShowPasswordFields(true)}
                disabled={isLoading}
              >
                <CsLineIcons icon="lock" className="me-2" />
                Change Password
              </Button>
            )}

            {!isAddMode && showPasswordFields && (
              <>
                <hr />
                <div className="mb-3">
                  <Form.Label>Admin Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="adminPassword"
                    value={values.adminPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.adminPassword && !!errors.adminPassword}
                    disabled={isLoading}
                  />
                  {renderError('adminPassword')}
                </div>
                <div className="mb-3">
                  <Form.Label>New Panel Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="newPassword"
                    value={values.newPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.newPassword && !!errors.newPassword}
                    disabled={isLoading}
                  />
                  {renderError('newPassword')}
                </div>
                <div className="mb-3">
                  <Form.Label>Confirm New Panel Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.confirmPassword && !!errors.confirmPassword}
                    disabled={isLoading}
                  />
                  {renderError('confirmPassword')}
                </div>
              </>
            )}

            {error && (
              <Alert variant="danger" className="mt-3">
                <CsLineIcons icon="error" className="me-2" />
                {error}
              </Alert>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isLoading}
            style={{ minWidth: '100px' }}
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
                Saving...
              </>
            ) : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Saving overlay */}
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
              <h5 className="mb-0">{isAddMode ? 'Creating' : 'Updating'} Panel User...</h5>
              <small className="text-muted">Please wait a moment</small>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ModalEditPanel;