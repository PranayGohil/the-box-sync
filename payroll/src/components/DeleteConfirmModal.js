import React from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const DeleteConfirmModal = ({
  show,
  onHide,
  onConfirm,
  title = "Confirm Deletion",
  bodyText = "Are you sure you want to delete this item? This action cannot be undone.",
  isDeleting = false
}) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <div style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger d-flex align-items-center">
            <div className="bg-danger bg-opacity-10 p-2 rounded-circle me-3 d-flex align-items-center justify-content-center">
              <CsLineIcons icon="warning-hexagon" size="24" className="text-danger" />
            </div>
            {title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3 pb-4">
          <p className="text-muted fs-6 mb-0 px-1">{bodyText}</p>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 pb-4 pe-4">
          <Button variant="light" className="rounded-pill px-4 fw-bold" onClick={onHide} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" className="rounded-pill px-4 shadow-sm fw-bold d-flex align-items-center" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <CsLineIcons icon="bin" size="18" className="me-2" />
                Delete
              </>
            )}
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;
