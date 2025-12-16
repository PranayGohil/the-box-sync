import React, { useState } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const DeletePanelModal = ({ show, handleClose, planName, fetchData }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');
    try {
      await axios.delete(`${process.env.REACT_APP_API}/panel-user/${planName}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      fetchData();
      toast.success('Panel user deleted successfully!');
      handleClose();
    } catch (err) {
      console.error('Error deleting panel:', err);
      setError(err.response?.data?.message || 'Failed to delete panel.');
      toast.error('Failed to delete panel.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal className="modal-close-out" show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <CsLineIcons icon="warning-hexagon" className="text-danger me-2" />
          Delete Panel
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Are you sure you want to delete the <strong>{planName}</strong> panel user?
        </p>
        <Alert variant="warning" className="mt-3">
          <CsLineIcons icon="warning-hexagon" className="me-2" />
          This action cannot be undone.
        </Alert>

        {error && (
          <Alert variant="danger" className="mt-3">
            <CsLineIcons icon="error" className="me-2" />
            {error}
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={isDeleting}>
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
              <h5 className="mb-0">Deleting Panel User...</h5>
              <small className="text-muted">Please wait a moment</small>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DeletePanelModal;