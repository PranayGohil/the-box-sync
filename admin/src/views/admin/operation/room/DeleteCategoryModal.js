import React, { useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import axios from 'axios';

const DeleteCategoryModal = ({ show, handleClose, data, fetchMenuData }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await axios.delete(`${process.env.REACT_APP_API}/menu/delete/${data._id}`, { // eslint-disable-line no-underscore-dangle
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      await fetchMenuData(); // Refresh the UI
      handleClose();
    } catch (err) {
      console.error('Error deleting dish:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal className="modal-close-out" show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Delete Dish</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to delete this dish?</p>
        <p>
          <strong>{data?.dish_name}</strong>
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? <Spinner animation="border" size="sm" /> : 'Delete'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteCategoryModal;
