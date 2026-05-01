import React from 'react';
import { Offcanvas, Button } from 'react-bootstrap';
import OrderCartTable from './OrderCartTable';

const BottomCartSheet = ({
  showCartSheet, setShowCartSheet, orderItems, updateItemQuantity, removeItem,
  isDirty, orderStatus, isLoading, printing, paymentData, orderId,
  handleSaveOrder, handleOpenPaymentModal, setShowCancelModal, handlePrint, history, children,
  alreadyPaid = 0
}) => {
  return (
    <Offcanvas
      show={showCartSheet}
      onHide={() => setShowCartSheet(false)}
      placement="bottom"
      style={{ height: '85vh', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem' }}
    >
      <Offcanvas.Header closeButton className="border-bottom">
        <Offcanvas.Title className="fw-bold">Your Cart ({orderItems.reduce((sum, item) => sum + item.quantity, 0)})</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className="p-0">
        <div className="p-3 h-100 overflow-auto bg-white">
          {children && <div className="mb-3">{children}</div>}
          <h6 className="mb-3 fw-bold text-muted border-bottom pb-2">Cart Items</h6>
          <OrderCartTable orderItems={orderItems} updateItemQuantity={updateItemQuantity} removeItem={removeItem} />
        </div>
      </Offcanvas.Body>

      {/* Footer Actions */}
      <div className="p-3 border-top bg-light" style={{ zIndex: 10 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex flex-column">
            <span className="fw-bold fs-5 text-muted">Total</span>
            <span className="fw-bold fs-4">₹{paymentData.total}</span>
          </div>
          {parseFloat(paymentData.total) - alreadyPaid > 0.01 && (
            <div className="text-end">
              <span className="text-danger fw-bold d-block">Due: ₹{(parseFloat(paymentData.total) - alreadyPaid).toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="d-flex flex-wrap gap-2">
          {orderItems.length > 0 && isDirty && (
            <Button variant="secondary" className="flex-grow-1" onClick={() => handleSaveOrder('Save')} disabled={isLoading}>Save Changes</Button>
          )}
          {(orderStatus === 'Save' || (orderStatus !== 'Paid' && isDirty) || (orderStatus === 'Paid' && isDirty)) && orderItems.length > 0 && (
            <Button variant="primary" className="flex-grow-1" onClick={() => handleSaveOrder('KOT')} disabled={isLoading}>Send to Kitchen</Button>
          )}
          {orderId && orderStatus !== 'Paid' && (
            <Button variant="danger" className="flex-grow-1" onClick={() => setShowCancelModal(true)} disabled={isLoading}>Cancel Order</Button>
          )}
          {orderStatus === 'Paid' && !isDirty && (parseFloat(paymentData.total) - alreadyPaid) <= 0.01 ? (
            <>
              <Button variant="primary" className="flex-grow-1" onClick={() => history.push('/dashboard')}>Go to Dashboard</Button>
              {orderId && (
                <Button variant="outline-secondary" className="flex-grow-1" onClick={() => handlePrint(orderId)} disabled={printing}>
                  {printing ? 'Printing...' : 'Print Bill'}
                </Button>
              )}
            </>
          ) : (
            (orderStatus === 'KOT' || (orderStatus === 'Save' && orderItems.length > 0) || (orderStatus === 'Paid' && (parseFloat(paymentData.total) - alreadyPaid) > 0.01)) && (
              <Button variant="success" className="flex-grow-1" onClick={() => { setShowCartSheet(false); handleOpenPaymentModal(); }}>
                {(parseFloat(paymentData.total) - alreadyPaid) > 0.01 && (alreadyPaid > 0) ? 'Pay Balance' : 'Process Payment'}
              </Button>
            )
          )}
        </div>
      </div>
    </Offcanvas>
  );
};

export default BottomCartSheet;
