import React, { useState } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const customStyles = `
  .delete-staff-modal-custom-btn-outline {
    border: 1px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .delete-staff-modal-custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .delete-staff-modal-custom-btn-danger {
    border: 1px solid #cf2637 !important;
    color: #cf2637 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .delete-staff-modal-custom-btn-danger:hover {
    background-color: #cf2637 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(207, 38, 55, 0.25) !important;
  }
  .delete-staff-modal-custom-btn-danger:hover svg {
    stroke: #fff !important;
  }
`;

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
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <style>{customStyles}</style>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold" style={{ color: '#cf2637' }}>
          Confirm Deletion
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        <div className="d-flex align-items-center mb-3">
          <div className="p-3 rounded-circle me-3" style={{ backgroundColor: 'rgba(207, 38, 55, 0.1)' }}>
            <CsLineIcons icon="bin" size="24" style={{ color: '#cf2637' }} />
          </div>
          <div>
            <p className="mb-0 fw-bold text-dark">Permanently delete {data?.f_name} {data?.l_name}?</p>
            <p className="mb-1 text-muted small">This clears the staff member from your active operations roster.</p>
            <p className="mb-0 text-success small fw-semibold">Historical payroll and attendance records remain perfectly safe.</p>
          </div>
        </div>
        {error && (
          <Alert variant="danger" className="rounded-3 shadow-sm border-0 d-flex align-items-center mt-3">
            <CsLineIcons icon="error" className="me-2" size="20" />
            <small>{error}</small>
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button 
          onClick={handleClose} 
          disabled={isDeleting}
          className="rounded-pill px-4 fw-bold delete-staff-modal-custom-btn-outline"
        >
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-pill px-4 fw-bold shadow-sm delete-staff-modal-custom-btn-danger"
        >
          {isDeleting ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Deleting...
            </>
          ) : (
            <div className="d-flex align-items-center">
              <CsLineIcons icon="bin" size="16" className="me-2" stroke="currentColor" />
              Delete
            </div>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteStaffModal;