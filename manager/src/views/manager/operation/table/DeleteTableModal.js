import React from 'react';
import { Button, Modal } from 'react-bootstrap';
import axios from 'axios';

const DeleteTableModal = ({ show, handleClose, data, onDeleteSuccess }) => {
  const handleDelete = async () => {
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
      onDeleteSuccess(); // to refresh the table list
    } catch (error) {
      console.error('Error deleting table:', error);
    }
  };

  return (
    <Modal className="modal-close-out" show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Delete Table</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to delete this table?</p>
        <div className="d-flex flex-column">
          <strong>Dining Area: {data?.area}</strong>
          <strong>Table Number: {data?.table_no}</strong>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteTableModal;
