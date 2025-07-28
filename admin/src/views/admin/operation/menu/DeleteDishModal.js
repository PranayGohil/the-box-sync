import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const DeleteDishModal = ({ show, handleClose, data }) => {
    return (
        <Modal className="modal-close-out" show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Delete Dish</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Are you sure you want to delete this dish?</p>
                <p>
                    <strong>{data.dish_name}</strong>
                </p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    onClick={() => {
                        console.log('Deleting dish:', data);
                        handleClose();
                    }}
                >
                    Delete
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DeleteDishModal;