import React, { useState } from 'react';
import { Offcanvas, Button, Badge, Modal } from 'react-bootstrap';
import OrderCartTable from './OrderCartTable';

const BottomCartSheet = ({
  showCartSheet, setShowCartSheet, orderItems, updateItemQuantity, removeItem,
  isDirty, orderStatus, isLoading, printing, paymentData, orderId,
  handleSaveOrder, handleOpenPaymentModal, setShowCancelModal, handlePrint, history, children,
  alreadyPaid = 0, canKOT = false,
  onKotAndPrint, kotPrinting, kotHistory = [], onReprintKOT,
  paymentHistory = [],
}) => {
  const [showKotHistory, setShowKotHistory] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  const isPaid = orderStatus === 'Paid';
  const showKOTButtons = (orderStatus === 'Save' || (orderStatus !== 'Paid' && isDirty) || (isPaid && isDirty)) && orderItems.length > 0;
  const totalAmount = parseFloat(paymentData.total);
  const totalPaid = paymentHistory.reduce((sum, p) => sum + parseFloat(p.amount), 0) || alreadyPaid;
  const dueAmount = Math.max(0, totalAmount - totalPaid);

  return (
    <>
      <Offcanvas
        show={showCartSheet}
        onHide={() => setShowCartSheet(false)}
        placement="bottom"
        style={{ height: '90vh', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem' }}
      >
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title className="fw-bold">Your Cart ({orderItems.reduce((sum, item) => sum + item.quantity, 0)})</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <div className="p-3 h-100 overflow-auto bg-white">
            {children && <div className="mb-3">{children}</div>}
            <h6 className="mb-3 fw-bold text-muted border-bottom pb-2">Cart Items</h6>
            <OrderCartTable orderItems={orderItems} updateItemQuantity={updateItemQuantity} removeItem={removeItem} />

            {/* History buttons - compact row */}
            {(kotHistory.length > 0 || paymentHistory.length > 0) && (
              <div className="d-flex gap-2 mt-3 flex-wrap">
                {kotHistory.length > 0 && (
                  <Button variant="outline-secondary" size="sm" onClick={() => setShowKotHistory(true)}>
                    Order Print History ({kotHistory.length})
                  </Button>
                )}
                {paymentHistory.length > 0 && (
                  <Button variant="outline-info" size="sm" onClick={() => setShowPaymentHistory(true)}>
                    Payments ({paymentHistory.length})
                  </Button>
                )}
              </div>
            )}
          </div>
        </Offcanvas.Body>

        {/* Footer Actions */}
        <div className="p-3 border-top bg-light" style={{ zIndex: 10 }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex flex-column">
              <span className="fw-bold fs-5 text-muted">Total</span>
              <span className="fw-bold fs-4">₹{paymentData.total}</span>
            </div>
            {totalPaid > 0 && (
              <div className="text-end">
                <span className="text-success d-block small">Paid: ₹{totalPaid.toFixed(2)}</span>
                <span className={`fw-bold d-block ${dueAmount > 0.01 ? 'text-danger' : 'text-success'}`}>
                  {dueAmount > 0.01 ? `Due: ₹${dueAmount.toFixed(2)}` : 'Fully Paid'}
                </span>
              </div>
            )}
          </div>
          <div className="d-flex flex-wrap gap-2">
            {/* Save Changes */}
            {orderItems.length > 0 && isDirty && (
              <Button variant="secondary" className="flex-grow-1" onClick={() => handleSaveOrder('Save')} disabled={isLoading}>Save Changes</Button>
            )}
            {/* Send to Kitchen */}
            {canKOT && showKOTButtons && (
              <Button variant="primary" className="flex-grow-1" onClick={() => handleSaveOrder('KOT')} disabled={isLoading}>Send to Kitchen</Button>
            )}
            {/* KOT & Print */}
            {showKOTButtons && (
              <Button variant="warning" className="flex-grow-1"
                onClick={() => {
                  setShowCartSheet(false);
                  if (onKotAndPrint) {
                    onKotAndPrint();
                  }
                }}
                disabled={isLoading || kotPrinting}>
                {kotPrinting ? 'Printing...' : 'Order Print'}
              </Button>
            )}
            {/* Cancel Order */}
            {orderId && orderStatus !== 'Paid' && (
              <Button variant="danger" className="flex-grow-1" onClick={() => setShowCancelModal(true)} disabled={isLoading}>Cancel Order</Button>
            )}
            {/* Paid state: Go to Dashboard + Print Bill */}
            {isPaid && !isDirty && dueAmount <= 0.01 ? (
              <>
                <Button variant="primary" className="flex-grow-1" onClick={() => history.push('/dashboard')}>Go to Dashboard</Button>
                {orderId && (
                  <Button variant="outline-secondary" className="flex-grow-1" onClick={() => handlePrint(orderId)} disabled={printing}>
                    {printing ? 'Printing...' : 'Print Bill'}
                  </Button>
                )}
              </>
            ) : (
              (orderStatus === 'KOT' || (orderStatus === 'Save' && orderItems.length > 0) || (isPaid && dueAmount > 0.01)) && (
                <Button variant="success" className="flex-grow-1" onClick={() => { setShowCartSheet(false); handleOpenPaymentModal(); }}>
                  {dueAmount > 0.01 && totalPaid > 0 ? 'Pay Balance' : 'Process Payment'}
                </Button>
              )
            )}
          </div>
        </div>
      </Offcanvas>

      {/* KOT History Modal */}
      <Modal show={showKotHistory} onHide={() => setShowKotHistory(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Order Print History</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {kotHistory.length === 0 ? (
            <p className="text-muted text-center">No order prints yet</p>
          ) : (
            [...kotHistory].reverse().map((record) => (
              <div key={record.id} className="border rounded p-2 mb-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div>
                    <Badge bg="dark" className="me-2">Print #{record.kotNo}</Badge>
                    <small className="text-muted">{new Date(record.timestamp).toLocaleTimeString('en-IN')}</small>
                  </div>
                  <Button size="sm" variant="outline-primary"
                    onClick={() => onReprintKOT && onReprintKOT(record)}
                    disabled={kotPrinting}>
                    Reprint
                  </Button>
                </div>
                <ul className="mb-0 ps-3" style={{ fontSize: '13px' }}>
                  {record.items.map((item, i) => (
                    <li key={i}>{item.dish_name} × {item.quantity}
                      {item.special_notes && <span className="text-muted ms-1">({item.special_notes})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowKotHistory(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Payment History Modal */}
      <Modal show={showPaymentHistory} onHide={() => setShowPaymentHistory(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Payment History</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div className="mb-3 p-2 bg-light rounded text-center">
            <div className="small text-muted">Total Order Amount</div>
            <div className="h4 mb-0 fw-bold">₹{totalAmount.toFixed(2)}</div>
          </div>
          {paymentHistory.length === 0 ? (
            <p className="text-muted text-center">No payments recorded yet</p>
          ) : (
            [...paymentHistory].reverse().map((record) => (
              <div key={record.id} className="border rounded p-3 mb-2 d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-bold fs-5 text-success">₹{parseFloat(record.amount).toFixed(2)}</div>
                  <div className="small text-muted">{record.type} • {new Date(record.timestamp).toLocaleString('en-IN')}</div>
                </div>
                <Badge bg="success">Success</Badge>
              </div>
            ))
          )}
          <div className="mt-3 p-2 border-top d-flex justify-content-between align-items-center">
            <span className="fw-bold">Total Paid:</span>
            <span className="fw-bold text-success">₹{totalPaid.toFixed(2)}</span>
          </div>
          {dueAmount > 0.01 && (
            <div className="p-2 d-flex justify-content-between align-items-center bg-warning-subtle">
              <span className="fw-bold">Remaining Due:</span>
              <span className="fw-bold text-danger">₹{dueAmount.toFixed(2)}</span>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaymentHistory(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default BottomCartSheet;
