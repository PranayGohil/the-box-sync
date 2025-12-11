import React, { useEffect, useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const DeleteStaffModal = ({ show, handleClose, data }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await axios.delete(`${process.env.REACT_APP_API}/staff/delete/${data._id}`, { 
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      toast.success('Staff deleted successfully!');
      handleClose();
    } catch (err) {
      console.error('Error deleting staff:', err);
      toast.error('Failed to delete staff.');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    console.log(data);
  }, []);

  return (
    <Modal className="modal-close-out" show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Delete Staff</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to delete this staff?</p>
        <p>
          <strong>{`${data.f_name} ${data.l_name}`}</strong>
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

export default DeleteStaffModal;
