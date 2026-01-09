import React, { useState } from 'react';
import { Button, Modal, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const DeleteTableModal = ({ show, handleClose, data, onDeleteSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await axios.delete(
        `${process.env.REACT_APP_API}/table/delete/${data.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      console.log('Table deleted:', res.data);
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
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Delete Table?
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>This will permanently remove the table from your restaurant layout.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="dark" onClick={handleClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
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
  );
};

export default DeleteTableModal;