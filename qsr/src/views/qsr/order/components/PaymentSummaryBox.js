import React, { useState } from 'react';
import { Button, Modal, Badge } from 'react-bootstrap';

const PaymentSummaryBox = ({
  orderItems, isDirty, orderStatus, isLoading, printing,
  paymentData, orderId, handleSaveOrder, handleOpenPaymentModal,
  setShowCancelModal, handlePrint, history, setShowCartSheet,
  onKotAndPrint, kotPrinting, kotHistory = [], onReprintKOT,
  paymentHistory = [], alreadyPaid = 0, canKOT = false
}) => {
  const [showKotHistory, setShowKotHistory] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  const isPaid = orderStatus === 'Paid';
  const showKOTButtons = (orderStatus === 'Save' || (orderStatus !== 'Paid' && isDirty) || (isPaid && isDirty)) && orderItems.length > 0;

  const totalAmount = parseFloat(paymentData.total);
  const totalPaid = (paymentHistory.reduce((sum, p) => sum + parseFloat(p.amount), 0)) || alreadyPaid;
  const dueAmount = Math.max(0, totalAmount - totalPaid);

  return (
    <>
      <style>{`
        @media (max-width: 991px) {
          .mobile-cart-bar {
            position: fixed; bottom: 0; left: 0; right: 0;
            background: #ffffff; color: #212529; padding: 16px 20px;
            z-index: 1040; cursor: pointer;
            box-shadow: 0 -4px 15px rgba(0,0,0,0.1);
            border-top: 1px solid #dee2e6;
          }
          .mobile-sticky-spacer { height: 80px; }
        }
      `}</style>

      <div className="mobile-sticky-spacer d-lg-none" />

      {orderItems.length > 0 && (
        <div className="d-lg-none mobile-cart-bar d-flex justify-content-between align-items-center" onClick={() => setShowCartSheet && setShowCartSheet(true)}>
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary text-white rounded d-flex justify-content-center align-items-center fw-bold" style={{ width: '40px', height: '40px', fontSize: '1.1rem' }}>
              {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
            <div className="d-flex flex-column">
              <span className="fw-bold" style={{ fontSize: '1.2rem', lineHeight: '1' }}>₹{paymentData.total}</span>
              <span className="small text-muted mt-1" style={{ fontSize: '0.8rem' }}>
                {dueAmount > 0.01 ? `Due: ₹${dueAmount.toFixed(2)}` : 'Fully Paid'}
              </span>
            </div>
          </div>
          <div className="fw-bold text-primary d-flex align-items-center gap-2">
            View Cart <i className="bi bi-chevron-right" />
          </div>
        </div>
      )}

      <div className="d-none d-lg-block">
        <div className="text-end mb-3">
          <h4 className="mb-0 fw-bold">Total: ₹{paymentData.total}</h4>
          {totalPaid > 0 && (
            <div className="text-muted small mt-1">
              Paid: ₹{totalPaid.toFixed(2)} | <span className={`${dueAmount > 0.01 ? 'text-danger' : 'text-success'} fw-bold`}>
                {dueAmount > 0.01 ? `Due: ₹${dueAmount.toFixed(2)}` : 'Fully Paid'}
              </span>
            </div>
          )}
        </div>
        <div className="d-flex justify-content-between gap-2">
          <div className="d-flex gap-2 flex-wrap">
            {/* Existing Save Order - now allowed if Paid but Dirty */}
            {orderItems.length > 0 && isDirty && (
              <Button variant="secondary" onClick={() => handleSaveOrder('Save')} disabled={isLoading}>Save Changes</Button>
            )}
            {/* Existing Send to Kitchen - now allowed if Paid but Dirty */}
            {canKOT && showKOTButtons && (
              <Button variant="primary" onClick={() => handleSaveOrder('KOT')} disabled={isLoading}>Send to Kitchen</Button>
            )}
            {/* NEW: KOT & Print */}
            {showKOTButtons && (
              <Button variant="warning" onClick={onKotAndPrint} disabled={isLoading || kotPrinting}>
                {kotPrinting ? 'Printing...' : 'Order Print'}
              </Button>
            )}
            {kotHistory.length > 0 && (
              <Button variant="outline-secondary" size="sm" onClick={() => setShowKotHistory(true)}>
                Order Print History ({kotHistory.length})
              </Button>
            )}
          </div>
          <div className="d-flex gap-2 flex-wrap justify-content-md-end">
            <div className="d-flex gap-2 me-2">
              {paymentHistory.length > 0 && (
                <Button variant="outline-info" size="sm" onClick={() => setShowPaymentHistory(true)}>
                  Payments ({paymentHistory.length})
                </Button>
              )}
            </div>

            {orderId && orderStatus !== 'Paid' && (
              <Button variant="danger" onClick={() => setShowCancelModal(true)} disabled={isLoading}>Cancel Order</Button>
            )}

            {(orderStatus === 'KOT' || (orderStatus === 'Save' && orderItems.length > 0) || (isPaid && dueAmount > 0.01)) && (
              <Button variant="success" onClick={handleOpenPaymentModal}>
                {dueAmount > 0.01 && totalPaid > 0 ? 'Pay Balance' : 'Process Payment'}
              </Button>
            )}

            {isPaid && !isDirty && dueAmount <= 0.01 && (
              <>
                <Button variant="primary" onClick={() => history.push('/dashboard')}>Go to Dashboard</Button>
                {orderId && (
                  <Button variant="outline-secondary" onClick={() => handlePrint(orderId)} disabled={printing}>
                    {printing ? 'Printing...' : 'Print Bill'}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

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

export default PaymentSummaryBox;
