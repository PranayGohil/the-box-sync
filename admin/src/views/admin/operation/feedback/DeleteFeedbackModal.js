import React, { useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import axios from 'axios';

const DeleteFeedbackModal = ({ show, handleClose, data, fetchFeedbacks }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (id) => {
        setIsDeleting(true);
        try {
            await axios.delete(`${process.env.REACT_APP_API}/feedback/delete/${data._id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            fetchFeedbacks();
        } catch (error) {
            console.error('Error deleting feedback:', error);
        } finally {
            setIsDeleting(false);
            handleClose();
        }
    };

    return (
        <Modal className="modal-close-out" show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Delete Feedback</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Are you sure you want to delete this feedback from {data?.customer_name}?</p>
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

export default DeleteFeedbackModal;
