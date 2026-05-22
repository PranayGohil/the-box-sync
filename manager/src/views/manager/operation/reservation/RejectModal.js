import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const API = process.env.REACT_APP_API;
const auth = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });
const fmtDate = (str) => new Date(`${str}T00:00:00`).toLocaleDateString('en-IN', { dateStyle: 'medium' });

const customStyles = `
  .pill-input {
    border-radius: 12px !important;
    padding: 0.7rem 1.2rem !important;
    border: 1px solid #e5e7eb !important;
    background: #ffffff !important;
    transition: all 0.2s ease !important;
  }
  .pill-input:focus {
    border-color: #cf2637 !important;
    box-shadow: 0 0 0 4px rgba(207, 38, 55, 0.1) !important;
    outline: none !important;
  }
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

const RejectModal = ({ show, reservation, onClose, onSuccess }) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) {
      setNote('');
    }
  }, [show]);

  const handleReject = async () => {
    setLoading(true);
    try {
      await axios.patch(`${API}/reservation/reject/${reservation._id}`, { 
        manager_notes: note 
      }, { headers: auth() });
      toast.success('Rejected.'); 
      onSuccess(); 
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject reservation.');
    } finally {
      setLoading(false);
    }
  };

  if (!reservation) return null;

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <style>{customStyles}</style>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold" style={{ color: '#cf2637' }}>
          Confirm Reject
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4 text-start">
        <div className="d-flex align-items-center mb-3">
          <div className="p-3 rounded-circle me-3" style={{ backgroundColor: 'rgba(207, 38, 55, 0.1)' }}>
            <CsLineIcons icon="close-circle" size="24" style={{ color: '#cf2637' }} />
          </div>
          <div>
            <p className="mb-0 fw-bold text-dark">Are you sure you want to reject this reservation?</p>
            <p className="mb-0 text-muted small">
              Rejecting for <strong>{reservation.customer_name}</strong> on {fmtDate(reservation.reservation_date)} at {reservation.slot_start}–{reservation.slot_end}.
            </p>
          </div>
        </div>

        <Form.Group className="mt-4">
          <Form.Label className="small fw-bold text-muted text-uppercase mb-2">Reason / Note to Customer (optional)</Form.Label>
          <Form.Control 
            as="textarea" 
            rows={3} 
            placeholder="e.g. Fully booked for that slot." 
            value={note} 
            onChange={(e) => setNote(e.target.value)} 
            className="pill-input w-100 shadow-sm bg-white"
            style={{ resize: 'none', borderRadius: '12px' }}
          />
        </Form.Group>
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
          variant="outline-danger" 
          onClick={handleReject} 
          disabled={loading} 
          className="rounded-pill px-4 fw-bold shadow-sm custom-btn-reject"
        >
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Rejecting...
            </>
          ) : (
            <div className="d-flex align-items-center">
              <CsLineIcons icon="close" size="16" className="me-2" stroke="currentColor" />
              Reject
            </div>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RejectModal;
