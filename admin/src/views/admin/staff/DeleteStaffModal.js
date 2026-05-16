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
    <Modal show={show} onHide={handleClose} centered className="rounded-4">
      
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold text-danger">Delete Staff Member?</Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        <div className="text-center mb-4">
          <div className="bg-soft-danger d-inline-flex p-4 rounded-circle mb-3">
            <CsLineIcons icon="bin" size="48" className="text-danger" />
          </div>
          <p className="text-muted mb-0">
            Are you sure you want to permanently delete <strong>{data?.f_name} {data?.l_name}</strong>? 
            This action will remove all staff records including attendance and payroll data.
          </p>
        </div>
        {error && (
          <Alert variant="danger" className="rounded-3 shadow-sm border-0 d-flex align-items-center">
            <CsLineIcons icon="error" className="me-2" size="20" />
            <small>{error}</small>
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0 d-flex gap-3">
        <Button 
          className="px-4 py-2 delete-staff-modal-custom-btn-outline flex-grow-1 d-flex align-items-center justify-content-center gap-2" 
          onClick={handleClose} 
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          className="px-4 py-2 delete-staff-modal-custom-btn-danger flex-grow-1 d-flex align-items-center justify-content-center gap-2"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <Spinner animation="border" size="sm" />
              Deleting...
            </>
          ) : (
            <>
              <CsLineIcons icon="bin" size="18" />
              Delete Member
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteStaffModal;