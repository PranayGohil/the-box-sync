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
    <Modal className="modal-close-out" show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <CsLineIcons icon="bin" className="text-danger me-2" />
          Delete Dish
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to delete this dish?</p>
        <p>
          <strong>{data?.dish_name}</strong>
        </p>
        <div className="alert alert-warning mt-3">
          <CsLineIcons icon="warning" className="me-2" />
          This action cannot be undone.
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={isDeleting}>
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