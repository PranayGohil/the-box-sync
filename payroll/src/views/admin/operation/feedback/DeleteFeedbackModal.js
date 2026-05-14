import React, { useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const customStyles = `
  .custom-btn-outline {
    border: 1px solid #1ea8e7 !important;
    color: #1ea8e7 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .custom-btn-outline:hover {
    background-color: #1ea8e7 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 168, 231, 0.25) !important;
  }
  .custom-btn-danger {
    background-color: #ef4444 !important;
    border: 1px solid #ef4444 !important;
    color: #fff !important;
    transition: all 0.2s ease-in-out !important;
    border-radius: 50px !important;
    font-weight: 600 !important;
  }
  .custom-btn-danger:hover {
    background-color: #dc2626 !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3) !important;
  }
`;

const DeleteFeedbackModal = ({ show, handleClose, data, fetchFeedbacks }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
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
        <Modal show={show} onHide={handleClose} centered className="rounded-4">
            <style>{customStyles}</style>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold text-danger">Delete Feedback?</Modal.Title>
            </Modal.Header>
            <Modal.Body className="py-4">
                <div className="text-center mb-3">
                    <CsLineIcons icon="bin" size="48" className="text-danger opacity-20" />
                </div>
                <p className="text-center text-muted mb-0">Are you sure you want to permanently delete this customer feedback? This action cannot be undone.</p>
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0 d-flex gap-3">
                <Button 
                    className="px-4 py-2 custom-btn-outline flex-grow-1 d-flex align-items-center justify-content-center gap-2" 
                    onClick={handleClose} 
                    disabled={isDeleting}
                >
                    Cancel
                </Button>
                <Button 
                    className="px-4 py-2 custom-btn-danger flex-grow-1 d-flex align-items-center justify-content-center gap-2" 
                    onClick={handleDelete} 
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <>
                            <Spinner animation="border" size="sm" />
                            Deleting...
                        </>
                    ) : (
                        <>
                            <CsLineIcons icon="bin" size="18" />
                            Delete
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DeleteFeedbackModal;