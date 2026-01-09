import React, { useState } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const DeleteStaffModal = ({ show, handleClose, data, onDeleteSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');
    try {
      await axios.delete(`${process.env.REACT_APP_API}/staff/delete/${data._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      toast.success('Staff deleted successfully!');
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
      handleClose();
    } catch (err) {
      console.error('Error deleting staff:', err);
      setError(err.response?.data?.message || 'Failed to delete staff.');
      toast.error('Failed to delete staff.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Delete Staff?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            This Member will be permanently deleted from your Staff.
          </p>
          {error && (
            <Alert variant="danger" className="mt-3">
              <CsLineIcons icon="error" className="me-2" />
              {error}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={isDeleting}
            style={{ minWidth: '100px' }}
          >
            {isDeleting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Deleting...
              </>
            ) : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Deleting overlay */}
      {isDeleting && (
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
                variant="danger"
                className="mb-3"
                style={{ width: '3rem', height: '3rem' }}
              />
              <h5 className="mb-0">Deleting Staff...</h5>
              <small className="text-muted">Please wait a moment</small>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteStaffModal;