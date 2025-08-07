import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useFormik } from 'formik';
import axios from 'axios';

function ModalEditPanel({ show, handleClose, data, planName, onSave }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const isAddMode = !data?._id;

  const { values, handleSubmit, handleChange, resetForm } = useFormik({
    initialValues: {
      username: data?.username || '',
      adminPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    enableReinitialize: true,
    onSubmit: async (formValues) => {
      try {
        setIsLoading(true);

        if (isAddMode) {
          // Creating panel user
          if (!formValues.newPassword || formValues.newPassword !== formValues.confirmPassword) {
            alert('Passwords do not match');
            return;
          }

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
          // Edit Mode
          if (showPasswordFields) {
            if (formValues.newPassword !== formValues.confirmPassword) {
              alert('Passwords do not match');
              return;
            }
            await axios.post(
              `${process.env.REACT_APP_API}/panel-user/${planName}/change-password`,
              {
                adminPassword: formValues.adminPassword,
                newPassword: formValues.newPassword,
              },
              {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              }
            );
          }

          // Always update username
          await onSave({ username: formValues.username });
        }

        setShowPasswordFields(false);
        handleClose();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || 'Something went wrong');
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

  return (
    <Modal className="modal-right fade" show={show} onHide={handleClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          {isAddMode ? 'Add' : 'Edit'} {planName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {/* Username */}
          <div className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control type="text" name="username" value={values.username} onChange={handleChange} />
          </div>

          {/* Add Mode: always show password fields */}
          {isAddMode && (
            <>
              <div className="mb-3">
                <Form.Label>Admin Password</Form.Label>
                <Form.Control type="password" name="adminPassword" value={values.adminPassword} onChange={handleChange} />
              </div>
              <div className="mb-3">
                <Form.Label>Panel Password</Form.Label>
                <Form.Control type="password" name="newPassword" value={values.newPassword} onChange={handleChange} />
              </div>
              <div className="mb-3">
                <Form.Label>Confirm Panel Password</Form.Label>
                <Form.Control type="password" name="confirmPassword" value={values.confirmPassword} onChange={handleChange} />
              </div>
            </>
          )}

          {/* Edit Mode password flow */}
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
                <Form.Control type="password" name="adminPassword" value={values.adminPassword} onChange={handleChange} />
              </div>
              <div className="mb-3">
                <Form.Label>New Panel Password</Form.Label>
                <Form.Control type="password" name="newPassword" value={values.newPassword} onChange={handleChange} />
              </div>
              <div className="mb-3">
                <Form.Label>Confirm New Panel Password</Form.Label>
                <Form.Control type="password" name="confirmPassword" value={values.confirmPassword} onChange={handleChange} />
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
