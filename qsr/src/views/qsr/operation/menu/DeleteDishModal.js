import React, { useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const DeleteDishModal = ({ show, handleClose, data, fetchMenuData }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await axios.delete(`${process.env.REACT_APP_API}/menu/delete/${data._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      toast.success('Dish deleted successfully!');
      await fetchMenuData();
      handleClose();
    } catch (err) {
      console.error('Error deleting dish:', err);
      toast.error(err.response?.data?.message || 'Failed to delete dish.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Delete Dish?
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>This dish will be permanently deleted from your menu.</p>
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
          ) : (
            'Delete'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteDishModal;