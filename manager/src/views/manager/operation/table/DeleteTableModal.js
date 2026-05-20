import React, { useState } from 'react';
import { Button, Modal, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const customStyles = `
  .delete-table-modal-custom-btn-outline {
    border: 1px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
  }
  .delete-table-modal-custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .delete-table-modal-custom-btn-delete {
    border: 1px solid #cf2637 !important;
    color: #cf2637 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
  }
  .delete-table-modal-custom-btn-delete:hover {
    background-color: #cf2637 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(207, 38, 55, 0.25) !important;
  }
  .delete-table-modal-custom-btn-delete:hover svg {
    stroke: #fff !important;
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
          Confirm Deletion
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        <div className="d-flex align-items-center mb-3">
          <div className="p-3 rounded-circle me-3" style={{ backgroundColor: 'rgba(207, 38, 55, 0.1)' }}>
            <CsLineIcons icon="bin" size="24" style={{ color: '#cf2637' }} />
          </div>
          <div>
            <p className="mb-0 fw-bold text-dark">Permanently delete Table #{data?.table_no}?</p>
            <p className="mb-1 text-muted small">This clears the table from your live {data?.area || ''} floor plan.</p>
            <p className="mb-0 text-success small fw-semibold">Historical sales and order logs remain perfectly safe.</p>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button 
          variant="outline-primary" 
          onClick={handleClose} 
          disabled={isDeleting}
          className="rounded-pill px-4 fw-bold delete-table-modal-custom-btn-outline"
        >
          Cancel
        </Button>
        <Button 
          variant="outline-danger" 
          onClick={handleDelete} 
          disabled={isDeleting}
          className="rounded-pill px-4 fw-bold shadow-sm delete-table-modal-custom-btn-delete"
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