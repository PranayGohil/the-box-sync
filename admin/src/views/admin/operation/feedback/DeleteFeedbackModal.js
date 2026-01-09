import React, { useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const DeleteFeedbackModal = ({ show, handleClose, data, fetchFeedbacks }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (id) => {
        setIsDeleting(true);
        try {
            await axios.delete(`${process.env.REACT_APP_API}/feedback/delete/${data._id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            toast.success('Feedback deleted successfully!');
            fetchFeedbacks();
        } catch (error) {
            console.error('Error deleting feedback:', error);
            toast.error('Failed to delete feedback. Please try again.');
        } finally {
            setIsDeleting(false);
            handleClose();
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Delete Feedback?</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Are you sure you want to delete this feedback?</p>
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

export default DeleteFeedbackModal;