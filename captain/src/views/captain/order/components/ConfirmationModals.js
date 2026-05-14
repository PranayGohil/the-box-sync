import React from 'react';
import { Modal, Button } from 'react-bootstrap';

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
    >
      <Modal.Header closeButton>
        <Modal.Title>Unsaved Changes</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>You have unsaved changes in this order.</p>
        <p>
          Please{' '}
          {orderStatus === 'Save' && (
            <>
              <strong>Save</strong> or
            </>
          )}{' '}
          <strong>Send to Kitchen</strong> before leaving.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="danger"
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
        </Button>
        {orderStatus === 'Save' && (
          <Button
            variant="secondary"
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
          </Button>
        )}

        <Button
          variant="primary"
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
          Send to Kitchen
        </Button>
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
    <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>Cancel Order?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>This order will permanently cancel.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="dark" onClick={() => setShowCancelModal(false)} disabled={isLoading}>
          Keep
        </Button>
        <Button variant="danger" onClick={handleCancelOrder} disabled={isLoading}>
          {isLoading ? 'Cancelling...' : 'Cancel'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
