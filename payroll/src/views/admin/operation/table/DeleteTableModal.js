import React, { useState } from 'react';
import { Button, Modal, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const customStyles = `
  .custom-btn-outline {
    border: 1px solid #1ea8e7 !important;
    color: #1ea8e7 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
  }
  .custom-btn-outline:hover {
    background-color: #1ea8e7 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.25) !important;
  }
  .custom-btn-delete {
    border: 1px solid #cf2637 !important;
    color: #cf2637 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
  }
  .custom-btn-delete:hover {
    background-color: #cf2637 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(207, 38, 55, 0.25) !important;
  }
  .custom-btn-delete:hover svg {
    stroke: #fff !important;
  }
  .modal-footer {
    display: flex !important;
    flex-direction: row !important;
    justify-content: flex-end !important;
    gap: 0.75rem !important;
  }
`;

const DeleteTableModal = ({ show, handleClose, data, onDeleteSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}/table/delete/${data.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      handleClose();
      toast.success('Table deleted successfully!');
      onDeleteSuccess();
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error(error.response?.data?.message || 'Failed to delete table.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <style>{customStyles}</style>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold" style={{ color: '#cf2637' }}>
          Confirm Delete
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        <div className="d-flex align-items-center mb-3">
          <div className="p-3 rounded-circle me-3" style={{ backgroundColor: 'rgba(207, 38, 55, 0.1)' }}>
            <CsLineIcons icon="bin" size="24" style={{ color: '#cf2637' }} />
          </div>
          <div>
            <p className="mb-0 fw-bold text-dark">Are you sure you want to delete this table?</p>
            <p className="mb-0 text-muted small">This action cannot be undone and will permanently remove the table from your restaurant layout.</p>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button 
          variant="outline-primary" 
          onClick={handleClose} 
          disabled={isDeleting}
          className="rounded-pill px-4 fw-bold custom-btn-outline"
        >
          Cancel
        </Button>
        <Button 
          variant="outline-danger" 
          onClick={handleDelete} 
          disabled={isDeleting}
          className="rounded-pill px-4 fw-bold shadow-sm custom-btn-delete"
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

export default DeleteTableModal;