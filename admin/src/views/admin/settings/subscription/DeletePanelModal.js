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
    <Modal show={show} onHide={handleClose} backdrop="static" centered>
      
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold" style={{ color: '#cf2637' }}>
          Delete Panel Credentials
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        <p className="mb-0">
          Are you sure you want to delete the credentials for <strong>{planName}</strong>? This action cannot be undone and will remove access to the panel.
        </p>
        {error && (
          <Alert variant="danger" className="mt-3 border-0 shadow-sm small fw-bold">
            <CsLineIcons icon="error" size="18" className="me-2" />
            {error}
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button 
          onClick={handleClose} 
          disabled={isDeleting}
          className="rounded-pill px-4 fw-bold delete-panel-modal-btn-pill-outline"
        >
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-pill px-4 fw-bold delete-panel-modal-btn-pill-danger"
        >
          {isDeleting ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Deleting...
            </>
          ) : (
            <div className="d-flex align-items-center">
              <CsLineIcons icon="bin" size="18" className="me-2" />
              Confirm Delete
            </div>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeletePanelModal;