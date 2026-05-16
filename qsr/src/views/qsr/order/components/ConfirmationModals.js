import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const modalStyles = `
  .modal-custom-confirm .modal-content {
    border-radius: 20px;
    border: none;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  }
  .modal-custom-confirm .modal-header {
    border-bottom: none;
    padding: 24px 24px 10px;
  }
  .modal-custom-confirm .modal-title {
    font-weight: 800;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .modal-custom-confirm .modal-body {
    padding: 10px 24px 24px;
    color: #475569;
    font-size: 15px;
    line-height: 1.6;
  }
  .modal-custom-confirm .modal-footer {
    border-top: 1px solid #f1f5f9;
    padding: 16px 24px;
    background: #f8fafc;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    gap: 12px;
  }

  /* Custom Red Button Style */
  .btn-qsr-red {
    background: #fff;
    color: #cf2637;
    border: 1.5px solid #cf2637;
    border-radius: 12px;
    padding: 10px 24px;
    font-weight: 700;
    transition: all 0.2s ease;
  }
  .btn-qsr-red:hover {
    background: #cf2637;
    color: #fff;
    box-shadow: 0 4px 12px rgba(207, 38, 55, 0.3);
  }

  /* Custom Blue Button Style */
  .btn-qsr-blue {
    background: #fff;
    color: #23b3f4;
    border: 1.5px solid #23b3f4;
    border-radius: 12px;
    padding: 10px 24px;
    font-weight: 700;
    transition: all 0.2s ease;
  }
  .btn-qsr-blue:hover {
    background: #23b3f4;
    color: #fff;
    box-shadow: 0 4px 12px rgba(35, 179, 244, 0.3);
  }

  /* Secondary Neutral Style */
  .btn-qsr-secondary {
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    padding: 10px 24px;
    font-weight: 700;
    color: #64748b;
    transition: all 0.2s ease;
  }
  .btn-qsr-secondary:hover {
    background: #f8fafc;
    color: #475569;
  }
`;

export const LeaveConfirmationModal = ({
  showLeaveModal,
  setShowLeaveModal,
  setNextLocation,
  orderStatus,
  allowNavigationRef,
  setIsDirty,
  nextLocation,
  history,
  handleSaveOrder,
  isLoading
}) => {
  return (
    <Modal
      show={showLeaveModal}
      onHide={() => {
        setShowLeaveModal(false);
        setNextLocation(null);
      }}
      centered
      backdrop="static"
      keyboard={false}
      className="modal-custom-confirm"
    >
      <style>{modalStyles}</style>
      <Modal.Header closeButton>
        <Modal.Title>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CsLineIcons icon="warning" size="20" />
          </div>
          Unsaved Changes
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">
          You have unsaved changes. If you leave now, these changes will be lost permanently.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          className="btn-qsr-red"
          style={{ marginRight: 'auto' }}
          onClick={() => {
            allowNavigationRef.current = true;
            setIsDirty(false);
            setShowLeaveModal(false);
            if (nextLocation) {
              setTimeout(() => {
                history.push(nextLocation);
              }, 0);
            }
          }}
        >
          Discard & Leave
        </button>
        
        {orderStatus === 'Save' && (
          <button
            type="button"
            className="btn-qsr-secondary"
            onClick={async () => {
              allowNavigationRef.current = true;
              await handleSaveOrder('Save');
              setShowLeaveModal(false);
              if (nextLocation) {
                setTimeout(() => {
                  history.push(nextLocation);
                }, 0);
              }
            }}
            disabled={isLoading}
          >
            Save Order
          </button>
        )}

        <button
          type="button"
          className="btn-qsr-blue"
          onClick={async () => {
            allowNavigationRef.current = true;
            await handleSaveOrder('KOT');
            setShowLeaveModal(false);
            if (nextLocation) {
              setTimeout(() => {
                history.push(nextLocation);
              }, 0);
            }
          }}
          disabled={isLoading}
        >
          Kitchen
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export const CancelOrderModal = ({
  showCancelModal,
  setShowCancelModal,
  handleCancelOrder,
  isLoading
}) => {
  return (
    <Modal 
      show={showCancelModal} 
      onHide={() => setShowCancelModal(false)} 
      centered 
      backdrop="static" 
      keyboard={false}
      className="modal-custom-confirm"
    >
      <style>{modalStyles}</style>
      <Modal.Header closeButton>
        <Modal.Title>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#cf2637', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CsLineIcons icon="bin" size="20" />
          </div>
          Cancel Order?
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">
          Are you sure you want to cancel this order? This action cannot be undone and all items will be cleared.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn-qsr-blue" onClick={() => setShowCancelModal(false)} disabled={isLoading}>
          Keep Order
        </button>
        <button type="button" className="btn-qsr-red" onClick={handleCancelOrder} disabled={isLoading}>
          {isLoading ? '...' : 'Confirm Cancel'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};
