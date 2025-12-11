import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';

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
      try {
        setIsLoading(true);

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
        }

        onSave({ username: formValues.username });

        setShowPasswordFields(false);
        handleClose();
      } catch (err) {
        console.error(err);
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
        <Modal.Title>{isAddMode ? 'Add' : 'Edit'} {planName}</Modal.Title>
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
                />
                {renderError('confirmPassword')}
              </div>
            </>
          )}

          {!isAddMode && !showPasswordFields && (
            <Button variant="outline-warning" size="sm" onClick={() => setShowPasswordFields(true)}>
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
                />
                {renderError('confirmPassword')}
              </div>
              <div className='mb-3 mx-2'>
                {error && <div className="text-danger text-medium">{error}</div>}
              </div>
            </>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-primary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ModalEditPanel;
