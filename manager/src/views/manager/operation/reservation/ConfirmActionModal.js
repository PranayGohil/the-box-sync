import React from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const customStyles = `
  .custom-btn-outline {
    border: 1px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
  }
  .custom-btn-outline:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .custom-btn-blue {
    border: 1px solid #23b3f4 !important;
    color: #23b3f4 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
  }
  .custom-btn-blue:hover {
    background-color: #23b3f4 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.25) !important;
  }
  .custom-btn-blue:hover svg {
    stroke: #fff !important;
  }
  .custom-btn-reject {
    border: 1px solid #cf2637 !important;
    color: #cf2637 !important;
    background-color: #fff !important;
    transition: all 0.2s ease-in-out !important;
  }
  .custom-btn-reject:hover {
    background-color: #cf2637 !important;
    color: #fff !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(207, 38, 55, 0.25) !important;
  }
  .custom-btn-reject:hover svg {
    stroke: #fff !important;
  }
`;

const ACTION_CONFIGS = {
  activate: {
    title: 'Confirm Activation',
    question: 'Are you sure you want to activate this reservation?',
    description: (name) => `This will reserve the tables and change the status of ${name}'s reservation to Reserved.`,
    icon: 'bookmark',
    iconColor: '#23b3f4',
    bgColor: 'rgba(35, 179, 244, 0.1)',
    btnText: 'Activate',
    btnClass: 'custom-btn-blue',
  },
  cancel: {
    title: 'Confirm Cancellation',
    question: 'Are you sure you want to cancel this reservation?',
    description: (name) => `This will cancel ${name}'s reservation and free all assigned tables.`,
    icon: 'slash',
    iconColor: '#cf2637',
    bgColor: 'rgba(207, 38, 55, 0.1)',
    btnText: 'Cancel Reservation',
    btnClass: 'custom-btn-reject',
  },
  seat: {
    title: 'Confirm Seating',
    question: 'Are you sure you want to seat this guest?',
    description: (name) => `This will change the status of ${name}'s reservation to Seated.`,
    icon: 'user-check',
    iconColor: '#23b3f4',
    bgColor: 'rgba(35, 179, 244, 0.1)',
    btnText: 'Seat Guest',
    btnClass: 'custom-btn-blue',
  },
  'no-show': {
    title: 'Confirm No-Show',
    question: 'Are you sure you want to mark this guest as no-show?',
    description: (name) => `This will mark ${name}'s reservation as No-Show and release their tables.`,
    icon: 'user-x',
    iconColor: '#cf2637',
    bgColor: 'rgba(207, 38, 55, 0.1)',
    btnText: 'Mark No-Show',
    btnClass: 'custom-btn-reject',
  },
  complete: {
    title: 'Confirm Completion',
    question: 'Are you sure you want to complete this reservation?',
    description: (name) => `This will complete ${name}'s reservation and close the visit.`,
    icon: 'check-square',
    iconColor: '#23b3f4',
    bgColor: 'rgba(35, 179, 244, 0.1)',
    btnText: 'Complete Visit',
    btnClass: 'custom-btn-blue',
  },
};

const ConfirmActionModal = ({ show, action, reservation, onClose, onConfirm, loading }) => {
  if (!reservation || !action || !ACTION_CONFIGS[action]) return null;

  const config = ACTION_CONFIGS[action];

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <style>{customStyles}</style>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold" style={{ color: config.iconColor }}>
          {config.title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4 text-start">
        <div className="d-flex align-items-center">
          <div className="p-3 rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: config.bgColor, width: 56, height: 56 }}>
            <CsLineIcons icon={config.icon} size="24" style={{ color: config.iconColor }} />
          </div>
          <div>
            <p className="mb-0 fw-bold text-dark">{config.question}</p>
            <p className="mb-0 text-muted small mt-1">
              {config.description(reservation.customer_name)}
            </p>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button 
          variant="outline-primary" 
          onClick={onClose} 
          disabled={loading} 
          className="rounded-pill px-4 fw-bold custom-btn-outline"
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          disabled={loading} 
          className={`rounded-pill px-4 fw-bold shadow-sm ${config.btnClass}`}
        >
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : (
            <div className="d-flex align-items-center">
              <CsLineIcons icon={config.icon} size="16" className="me-2" stroke="currentColor" />
              {config.btnText}
            </div>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmActionModal;
