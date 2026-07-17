import React, { useState } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const DeletePanelModal = ({ show, handleClose, planName, accountId, fetchData }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleCloseModal = () => {
    setPassword('');
    setError('');
    handleClose();
  };

  const handleDelete = async () => {
    if (!password) {
      setError('Admin password is required to delete credentials.');
      return;
    }

    setIsDeleting(true);
    setError('');
    try {
      if (accountId) {
        await axios.delete(`${process.env.REACT_APP_API}/panel-user/cashier/${accountId}`, {
          data: { adminPassword: password },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
      } else {
        await axios.delete(`${process.env.REACT_APP_API}/panel-user/${planName}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'x-admin-password': password,
          },
        });
      }
      fetchData();
      toast.success('Panel credentials deleted successfully!');
      handleCloseModal();
    } catch (err) {
      console.error('Error deleting panel:', err);
      setError(err.response?.data?.message || 'Failed to delete panel.');
      toast.error('Failed to delete panel.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleCloseModal} backdrop="static" centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold" style={{ color: '#cf2637' }}>
          Confirm Deletion
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        <div className="d-flex align-items-center mb-4">
          <div className="p-3 rounded-circle me-3" style={{ backgroundColor: 'rgba(207, 38, 55, 0.1)', flexShrink: 0 }}>
            <CsLineIcons icon="bin" size="24" style={{ color: '#cf2637' }} />
          </div>
          <div>
            <p className="mb-0 fw-bold text-dark">Permanently delete panel credentials?</p>
            <p className="mb-1 text-muted small">
              Are you sure you want to delete the credentials for <strong>{planName}</strong>? This removes access to this specific panel.
            </p>
            <p className="mb-0 text-success small fw-semibold">Your global subscription active state remains perfectly safe.</p>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label small fw-bold text-danger">Enter Admin Password to Confirm *</label>
          <div className="position-relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control rounded-3"
              placeholder="Enter your admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isDeleting}
              style={{ paddingRight: '40px' }}
            />
            <span
              className="position-absolute"
              style={{ right: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, cursor: 'pointer', zIndex: 10 }}
              onClick={() => setShowPassword(!showPassword)}
            >
              <CsLineIcons icon={showPassword ? 'eye-off' : 'eye'} size="15" />
            </span>
          </div>
        </div>
        {error && (
          <Alert variant="danger" className="mt-3 border-0 shadow-sm small fw-bold d-flex align-items-center">
            <CsLineIcons icon="error" size="18" className="me-2" />
            {error}
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <Button onClick={handleCloseModal} disabled={isDeleting} className="rounded-pill px-4 fw-bold delete-panel-modal-btn-pill-outline">
          Cancel
        </Button>
        <Button onClick={handleDelete} disabled={isDeleting || !password} className="rounded-pill px-4 fw-bold shadow-sm delete-panel-modal-btn-pill-danger">
          {isDeleting ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Deleting...
            </>
          ) : (
            <div className="d-flex align-items-center">
              <CsLineIcons icon="bin" size="16" className="me-2" stroke="currentColor" />
              Delete
            </div>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeletePanelModal;
